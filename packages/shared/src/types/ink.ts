export interface InkFile {
    id: number;
    chapterId: number;
    filename: string;
    displayName?: string;
    content?: string;
    compiledPath?: string;
    isStart?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateInkFileDto {
    filename: string;
    displayName?: string;
    content?: string;
}

export interface UpdateInkFileDto {
    filename?: string;
    displayName?: string;
    content?: string;
    compiledPath?: string;
    isStart?: boolean;
}

export interface CompileInkResponse {
    compiledContent: string;
}
