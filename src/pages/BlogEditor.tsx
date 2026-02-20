import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlog } from '@/contexts/BlogContext';
import { useUserData } from '@/contexts/UserDataContext';
import { BlogPost } from '@/types/blog';

const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPostById, createPost, updatePost } = useBlog();
  const { userData } = useUserData();
  
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [originalPost, setOriginalPost] = useState<BlogPost | null>(null);
  
  // 加载博客数据（如果是编辑模式）
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const post = await fetchPostById(id);
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setSummary(post.summary);
          setCoverImage(post.coverImage || '');
          setTags(post.tags);
          setStatus(post.status);
          setIsEditing(true);
          setOriginalPost(post);
        } else {
          setError('博客不存在或已被删除');
        }
      } catch (err) {
        console.error('加载博客失败:', err);
        setError('加载博客失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [id, fetchPostById]);
  
  // 处理标签添加
  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    // 检查标签是否已存在
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    
    setTagInput('');
  };
  
  // 处理标签删除
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // 处理标签输入按键
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // 自动生成摘要
  const generateSummary = () => {
    if (!content) return;
    
    // 简单地取内容的前100个字符作为摘要
    const plainText = content.replace(/#+\s+/g, '').replace(/\n/g, ' ');
    const summary = plainText.slice(0, 100) + (plainText.length > 100 ? '...' : '');
    setSummary(summary);
  };
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const postData = {
        title: title.trim(),
        content,
        summary: summary.trim() || title.trim(),
        coverImage: coverImage || undefined,
        authorId: userData.userId,
        authorName: userData.username,
        tags: tags.length > 0 ? tags : ['未分类'],
        status: saveAsDraft ? 'draft' as const : 'published' as const
      };
      
      let result;
      
      if (isEditing && originalPost) {
        // 更新博客
        result = await updatePost(originalPost.id, {
          ...postData,
          lastUpdated: new Date()
        });
      } else {
        // 创建新博客
        result = await createPost(postData);
      }
      
      if (result) {
        // 跳转到博客详情页
        navigate(`/blog/${result.id}`);
      } else {
        setError('保存博客失败');
      }
    } catch (err) {
      console.error('保存博客失败:', err);
      setError('保存博客失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理取消
  const handleCancel = () => {
    if (isEditing) {
      navigate(`/blog/${id}`);
    } else {
      navigate('/blog-center');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50">
      {/* 导航栏 */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-3 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">AllinONE</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              保存草稿
            </button>
            <button
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              {loading ? '发布中...' : '发布博客'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? '编辑博客' : '创建新博客'}
          </h1>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          
          <form onSubmit={(e) => handleSubmit(e, false)}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden p-6">
              {/* 标题 */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入博客标题"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {/* 封面图 */}
              <div className="mb-6">
                <label htmlFor="coverImage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  封面图片 URL（可选）
                </label>
                <input
                  type="text"
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="输入图片URL"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {coverImage && (
                  <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden">
                    <img 
                      src={coverImage} 
                      alt="封面预览" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=placeholder%20image%2C%20error%20loading&sign=a160cbc38262558651adba1662dee0ce';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              {/* 内容 */}
              <div className="mb-6">
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="使用Markdown格式编写博客内容"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px] font-mono"
                  required
                ></textarea>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  支持Markdown格式，如 # 标题, ## 二级标题, **粗体**, *斜体* 等
                </div>
              </div>
              
              {/* 摘要 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    摘要（可选）
                  </label>
                  <button
                    type="button"
                    onClick={generateSummary}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    自动生成摘要
                  </button>
                </div>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="简短描述博客内容，不填写将自动生成"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                ></textarea>
              </div>
              
              {/* 标签 */}
              <div className="mb-6">
                <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <div 
                      key={index}
                      className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="输入标签，按回车添加"
                    className="flex-grow bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700"
                  >
                    添加
                  </button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  最多添加5个标签，每个标签不超过10个字符
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-end mt-6 space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="px-6 py-3 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                保存草稿
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? '发布中...' : '发布博客'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default BlogEditor;