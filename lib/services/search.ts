import { api } from "../api";

interface SearchDefalutResponse {
  code: number;
  data: {
    showKeyword: string;
    realkeyword: string;
  };
}

export async function getSearchDefault() {
  const res = await api.get<SearchDefalutResponse>("/search/default");
  if (res.code !== 200) return null;
  return res.data;
}
