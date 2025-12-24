import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, Image, Layers, FileText, ArrowRight, MessageSquare } from 'lucide-react';

interface InkSyntaxHelpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InkSyntaxHelpDialog({ open, onOpenChange }: InkSyntaxHelpDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-4xl max-h-[90vh]'>
                <DialogHeader>
                    <DialogTitle>Ink 语法帮助</DialogTitle>
                    <DialogDescription>Pixi'VN Ink 语法参考文档</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue='commands' className='w-full'>
                    <TabsList className='grid w-full grid-cols-4'>
                        <TabsTrigger value='commands'>命令</TabsTrigger>
                        <TabsTrigger value='resources'>资源</TabsTrigger>
                        <TabsTrigger value='flow'>流程控制</TabsTrigger>
                        <TabsTrigger value='dialogue'>对话</TabsTrigger>
                    </TabsList>

                    <TabsContent value='commands' className='mt-4'>
                        <div className='h-[60vh] overflow-y-auto pr-4'>
                            <div className='space-y-6'>
                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <Code2 className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>资源加载命令</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># lazyload bundle</span>
                                                <span className='text-sm text-muted-foreground'>预加载资源包</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code># lazyload bundle m01 fm01 fm02</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                预加载指定的资源包，可以指定多个 bundle 名称，用空格分隔。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <Image className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>图片显示命令</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># show image</span>
                                                <span className='text-sm text-muted-foreground'>显示单个图片</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code># show image bg bg01-hallway</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                显示单个图片资源。第一个参数是别名（alias），第二个参数是资源名称。
                                            </p>
                                        </div>

                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># show imagecontainer</span>
                                                <span className='text-sm text-muted-foreground'>显示图片容器（图层组合）</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>
                                                    {`# show imagecontainer james [m01-body m01-eyes-smile m01-mouth-neutral01] xAlign 0.5 yAlign 1`}
                                                </code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                显示图片容器，可以组合多个图片资源作为图层叠加。支持位置对齐（xAlign, yAlign）和动画效果。
                                            </p>
                                        </div>

                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># remove image</span>
                                                <span className='text-sm text-muted-foreground'>移除图片</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code># remove image james with moveout direction right</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                移除指定的图片或图片容器，支持动画效果。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <FileText className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>文本显示命令</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># show text</span>
                                                <span className='text-sm text-muted-foreground'>显示文本</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code># show text bg "文本内容"</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                显示文本内容，支持样式设置。
                                            </p>
                                        </div>

                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'># edit text</span>
                                                <span className='text-sm text-muted-foreground'>编辑文本</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code># edit text bg align 0.5</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                编辑已显示的文本属性，如对齐方式等。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='resources' className='mt-4'>
                        <div className='h-[60vh] overflow-y-auto pr-4'>
                            <div className='space-y-6'>
                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <Layers className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>资源引用</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <h4 className='font-medium mb-2'>Bundle 资源</h4>
                                            <p className='text-sm text-muted-foreground'>
                                                Bundle 是资源的集合，通过 <code className='bg-background px-1 rounded'># lazyload bundle</code> 命令预加载。
                                                例如：<code className='bg-background px-1 rounded'>m01</code>, <code className='bg-background px-1 rounded'>fm01</code>
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className='font-medium mb-2'>单个资源</h4>
                                            <p className='text-sm text-muted-foreground'>
                                                单个资源通过别名引用，例如：<code className='bg-background px-1 rounded'>bg01-hallway</code>
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className='font-medium mb-2'>资源组合</h4>
                                            <p className='text-sm text-muted-foreground'>
                                                在 <code className='bg-background px-1 rounded'>imagecontainer</code> 中，可以使用方括号组合多个资源：
                                            </p>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto mt-2'>
                                                <code>[m01-body m01-eyes-smile m01-mouth-neutral01]</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                这些资源会按顺序叠加显示，形成图层效果。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='flow' className='mt-4'>
                        <div className='h-[60vh] overflow-y-auto pr-4'>
                            <div className='space-y-6'>
                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <ArrowRight className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>流程控制</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'>INCLUDE</span>
                                                <span className='text-sm text-muted-foreground'>包含文件</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>INCLUDE second_part.ink</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                包含其他 Ink 文件的内容。
                                            </p>
                                        </div>

                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'>{'->'}</span>
                                                <span className='text-sm text-muted-foreground'>跳转到标签</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>{'-> start'}</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                跳转到指定的标签位置。
                                            </p>
                                        </div>

                                        <div>
                                            <div className='flex items-center gap-2 mb-2'>
                                                <span className='px-2 py-1 bg-primary/10 text-primary rounded text-sm font-medium'>===</span>
                                                <span className='text-sm text-muted-foreground'>定义标签</span>
                                            </div>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>=== start ===</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                定义一个标签，可以通过 <code className='bg-background px-1 rounded'>{'->'}</code> 跳转到这里。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value='dialogue' className='mt-4'>
                        <div className='h-[60vh] overflow-y-auto pr-4'>
                            <div className='space-y-6'>
                                <div className='space-y-2'>
                                    <div className='flex items-center gap-2'>
                                        <MessageSquare className='h-5 w-5 text-primary' />
                                        <h3 className='text-lg font-semibold'>对话语法</h3>
                                    </div>
                                    <div className='bg-muted p-4 rounded-lg space-y-3'>
                                        <div>
                                            <h4 className='font-medium mb-2'>角色对话</h4>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>james: 你就是我新室友，对吧？</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                角色名称后跟冒号和对话内容。
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className='font-medium mb-2'>旁白</h4>
                                            <pre className='bg-background p-3 rounded text-sm overflow-x-auto'>
                                                <code>He thrusts out his hand.</code>
                                            </pre>
                                            <p className='text-sm text-muted-foreground mt-2'>
                                                不包含冒号的行会被视为旁白文本。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

