/**
 * Ink代码资源引用解析工具
 */

export interface ParsedResourceReference {
    type: 'bundle' | 'resource' | 'resourceGroup';
    value: string;
    resources?: string[];
    line: number;
    column: number;
    endColumn: number;
    keyword?: 'lazyload' | 'show' | 'image' | 'imagecontainer';
    context?: string; // 上下文信息，如 'bundle', 'image', 'imagecontainer'
}

/**
 * 解析光标位置附近的资源引用
 * @param text 完整的文本内容
 * @param lineNumber 行号（从1开始）
 * @param column 列号（从1开始）
 * @returns 解析结果，如果没有找到则返回null
 */
export function parseResourceReference(
    text: string,
    lineNumber: number,
    column: number,
): ParsedResourceReference | null {
    const lines = text.split('\n');
    if (lineNumber < 1 || lineNumber > lines.length) {
        return null;
    }

    const line = lines[lineNumber - 1];
    const lineText = line.trim();

    // 检查是否在资源组合中 [resource1 resource2 ...]
    const resourceGroupMatch = /\[([a-zA-Z0-9_\s-]+)\]/.exec(line);
    if (resourceGroupMatch) {
        const startIndex = resourceGroupMatch.index;
        const endIndex = startIndex + resourceGroupMatch[0].length;
        if (column >= startIndex + 1 && column <= endIndex) {
            const resources = resourceGroupMatch[1]
                .trim()
                .split(/\s+/)
                .filter(r => r.length > 0);
            return {
                type: 'resourceGroup',
                value: resourceGroupMatch[0],
                resources,
                line: lineNumber,
                column: startIndex + 1,
                endColumn: endIndex,
            };
        }
    }

    // 检查是否在 # lazyload bundle 行中
    if (lineText.startsWith('# lazyload bundle')) {
        // 匹配所有 bundle 名称
        const bundlePattern = /#\s+lazyload\s+bundle\s+((?:[a-zA-Z0-9_-]+\s*)+)/;
        const bundleMatch = bundlePattern.exec(line);
        if (bundleMatch) {
            const bundles = bundleMatch[1].trim().split(/\s+/);
            // 检查光标是否在任何一个 bundle 名称上
            let currentPos = bundleMatch.index + bundleMatch[0].indexOf(bundles[0]);
            for (const bundleName of bundles) {
                const startIndex = currentPos;
                const endIndex = startIndex + bundleName.length;
                if (column >= startIndex + 1 && column <= endIndex) {
                    return {
                        type: 'bundle',
                        value: bundleName,
                        line: lineNumber,
                        column: startIndex + 1,
                        endColumn: endIndex,
                        keyword: 'lazyload',
                        context: 'bundle',
                    };
                }
                currentPos = endIndex + 1; // 移动到下一个 bundle（考虑空格）
            }
        }
    }

    // 检查是否在 # show image 行中（单个图片）
    if (lineText.includes('# show image') && !lineText.includes('imagecontainer')) {
        const imageMatch = /#\s+show\s+image\s+(\w+)\s+([a-zA-Z0-9_-]+)/.exec(line);
        if (imageMatch) {
            const resourceName = imageMatch[2];
            const resourceStartIndex = imageMatch.index + imageMatch[0].indexOf(resourceName);
            const resourceEndIndex = resourceStartIndex + resourceName.length;
            if (column >= resourceStartIndex + 1 && column <= resourceEndIndex) {
                return {
                    type: 'resource',
                    value: resourceName,
                    line: lineNumber,
                    column: resourceStartIndex + 1,
                    endColumn: resourceEndIndex,
                    keyword: 'show',
                    context: 'image',
                };
            }
        }
    }

    // 检查是否在 # show imagecontainer 行中
    if (lineText.includes('# show imagecontainer')) {
        // 提取容器名称后的资源引用
        const containerMatch = /#\s+show\s+imagecontainer\s+(\w+)\s+\[([^\]]+)\]/.exec(line);
        if (containerMatch) {
            const resources = containerMatch[2]
                .trim()
                .split(/\s+/)
                .filter(r => r.length > 0);
            // 检查光标是否在资源组合中
            const resourcesStartIndex = containerMatch.index + containerMatch[0].indexOf('[');
            const resourcesEndIndex = containerMatch.index + containerMatch[0].lastIndexOf(']') + 1;
            if (column >= resourcesStartIndex + 1 && column <= resourcesEndIndex) {
                // 检查光标是否在具体的资源名称上
                let currentPos = resourcesStartIndex + 1; // 跳过 '['
                for (const resourceName of resources) {
                    const startIndex = currentPos;
                    const endIndex = startIndex + resourceName.length;
                    if (column >= startIndex + 1 && column <= endIndex) {
                        return {
                            type: 'resource',
                            value: resourceName,
                            line: lineNumber,
                            column: startIndex + 1,
                            endColumn: endIndex,
                            keyword: 'show',
                            context: 'imagecontainer',
                        };
                    }
                    currentPos = endIndex + 1; // 移动到下一个资源（考虑空格）
                }
                // 如果光标在资源组合内但不在具体资源上，返回整个资源组合
                return {
                    type: 'resourceGroup',
                    value: containerMatch[0],
                    resources,
                    line: lineNumber,
                    column: resourcesStartIndex + 1,
                    endColumn: resourcesEndIndex,
                    keyword: 'show',
                    context: 'imagecontainer',
                };
            }
        }
    }

    // 检查单个资源引用（单词边界匹配）
    // 排除对话行（包含冒号的行）
    if (!line.includes(':')) {
        const wordPattern = /\b([a-zA-Z0-9_-]+)\b/g;
        let match;
        while ((match = wordPattern.exec(line)) !== null) {
            const startIndex = match.index;
            const endIndex = startIndex + match[0].length;
            if (column >= startIndex + 1 && column <= endIndex) {
                const word = match[1];
                // 排除明显的命令关键字和标签
                if (
                    ![
                        'show',
                        'image',
                        'imagecontainer',
                        'lazyload',
                        'bundle',
                        'INCLUDE',
                        'start',
                        '===',
                        'with',
                        'direction',
                        'ease',
                        'type',
                        'align',
                        'xAlign',
                        'yAlign',
                    ].includes(word.toLowerCase())
                ) {
                    return {
                        type: 'resource',
                        value: word,
                        line: lineNumber,
                        column: startIndex + 1,
                        endColumn: endIndex,
                    };
                }
            }
        }
    }

    return null;
}

