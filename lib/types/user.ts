export interface Account {
    id: number;
    userName: string;
    type: number;
    status: number;
    whitelistAuthority: number;
    createTime: number;
    salt: string;
    tokenVersion: number;
    ban: number;
    baoyueVersion: number;
    donateVersion: number;
    vipType: number;
    viptypeVersion: number;
    anonimousUser: boolean;
    uninitialized: boolean;
}

export interface UserProfile {
    userId: number;
    nickname: string;
    avatarUrl: string;
    backgroundUrl: string;
    signature: string;
    description: string;
    followed: boolean;
    gender: number;
    follows: number;
    followeds: number;
}
