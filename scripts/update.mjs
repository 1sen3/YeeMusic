// scripts/update.mjs
import fetch from "node-fetch";
import { getOctokit, context } from "@actions/github";

const UPDATE_TAG_NAME = "updater";
const UPDATE_FILE_NAME = "update.json";

// 辅助函数：获取签名文件内容
const getSignature = async (url) => {
  const response = await fetch(url);
  return response.text();
};

// 初始化GitHub API客户端
const octokit = getOctokit(process.env.GITHUB_TOKEN);
const { owner, repo } = context.repo;

try {
  // 1. 获取最新的正式发布（由tauri-action创建）
  const { data: latestRelease } = await octokit.rest.repos.getLatestRelease({
    owner,
    repo,
  });
  console.log(`Processing release: ${latestRelease.tag_name}`);

  // 初始化更新数据对象（仅Windows平台）
  const updateData = {
    name: latestRelease.tag_name,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": { signature: "", url: "" },
    },
  };

  // 2. 遍历发布中的资产，匹配Windows更新包
  console.log(`Found ${latestRelease.assets.length} assets in release:`);
  for (const asset of latestRelease.assets) {
    const { name, browser_download_url: url } = asset;
    console.log(`  - ${name}`);

    // Windows - Tauri v2 NSIS (.nsis.zip) 或 Tauri v1 MSI (.msi.zip)
    if (name.endsWith(".nsis.zip") && !name.endsWith(".nsis.zip.sig")) {
      updateData.platforms["windows-x86_64"].url = url;
      console.log(`  ✓ Matched as Windows NSIS updater bundle`);
    } else if (name.endsWith(".nsis.zip.sig")) {
      updateData.platforms["windows-x86_64"].signature = await getSignature(url);
      console.log(`  ✓ Matched as Windows NSIS signature`);
    } else if (name.endsWith(".msi.zip") && !name.endsWith(".msi.zip.sig")) {
      // msi.zip 作为备选，如果已有 nsis.zip 则跳过
      if (!updateData.platforms["windows-x86_64"].url) {
        updateData.platforms["windows-x86_64"].url = url;
        console.log(`  ✓ Matched as Windows MSI updater bundle`);
      }
    } else if (name.endsWith(".msi.zip.sig")) {
      if (!updateData.platforms["windows-x86_64"].signature) {
        updateData.platforms["windows-x86_64"].signature = await getSignature(url);
        console.log(`  ✓ Matched as Windows MSI signature`);
      }
    }
  }

  // 检查是否找到了必需的文件
  const win = updateData.platforms["windows-x86_64"];
  if (!win.url || !win.signature) {
    console.warn("⚠ Warning: Windows updater data is incomplete!");
    console.warn(`  url: ${win.url || "(empty)"}`);
    console.warn(`  signature: ${win.signature ? "(found)" : "(empty)"}`);
    console.warn("  请确保 tauri.conf.json 中设置了 createUpdaterArtifacts: \"v1Compatible\"");
  }

  // 3. 获取或创建用于存放update.json的"updater"标签发布
  let updaterRelease;
  try {
    const { data } = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag: UPDATE_TAG_NAME,
    });
    updaterRelease = data;
    console.log(`Found existing updater release: ${updaterRelease.id}`);
  } catch (error) {
    if (error.status === 404) {
      const { data } = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: UPDATE_TAG_NAME,
        name: "Updater Channel",
        body: "This release contains the auto-generated update manifest.",
        draft: false,
        prerelease: false,
      });
      updaterRelease = data;
      console.log(`Created new updater release: ${updaterRelease.id}`);
    } else {
      throw error;
    }
  }

  // 4. 删除旧的update.json资产（如果存在）
  for (const asset of updaterRelease.assets) {
    if (asset.name === UPDATE_FILE_NAME) {
      await octokit.rest.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: asset.id,
      });
      console.log(`Deleted old asset: ${asset.name}`);
      break;
    }
  }

  // 5. 上传新生成的 update.json
  const updateJsonString = JSON.stringify(updateData, null, 2);
  await octokit.rest.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: updaterRelease.id,
    name: UPDATE_FILE_NAME,
    data: Buffer.from(updateJsonString),
    headers: {
      "content-type": "application/json",
    },
  });

  console.log(`Successfully uploaded ${UPDATE_FILE_NAME} to updater release.`);
  console.log("Update manifest content:", updateJsonString);
} catch (error) {
  console.error("Failed to generate update manifest:", error);
  process.exit(1);
}
