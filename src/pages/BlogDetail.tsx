import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBlog } from '@/contexts/BlogContext';
import { useUserData } from '@/contexts/UserDataContext';
import { BlogPost, BlogComment } from '@/types/blog';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchPostById, likePost, fetchComments, addComment } = useBlog();
  const { userData } = useUserData();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  
  // 加载博客详情
  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const postData = await fetchPostById(id);
        if (postData) {
          setPost(postData);
          
          // 加载评论
          const commentsData = await fetchComments(id);
          setComments(commentsData);
        } else {
          setError('博客不存在或已被删除');
        }
      } catch (err) {
        console.error('加载博客详情失败:', err);
        setError('加载博客详情失败');
      } finally {
        setLoading(false);
      }
    };
    
    loadPost();
  }, [id, fetchPostById, fetchComments]);
  
  // 处理点赞
  const handleLike = async () => {
    if (!post || liked) return;
    
    try {
      const updatedPost = await likePost(post.id);
      if (updatedPost) {
        setPost(updatedPost);
        setLiked(true);
      }
    } catch (err) {
      console.error('点赞失败:', err);
    }
  };
  
  // 处理评论提交
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!post || !commentContent.trim() || submittingComment) return;
    
    setSubmittingComment(true);
    
    try {
      const newComment = await addComment({
        postId: post.id,
        content: commentContent,
        authorId: userData.userId,
        authorName: userData.username,
        authorAvatar: undefined // 可以从用户数据中获取头像
      });
      
      setComments(prevComments => [newComment, ...prevComments]);
      setCommentContent('');
    } catch (err) {
      console.error('提交评论失败:', err);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // 处理返回
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50 pt-24 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-50 pt-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
              {error || '博客不存在或已被删除'}
            </h2>
            <button
              onClick={handleBack}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    );
  }
  
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
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">首页</Link>
            <Link to="/game-center" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">游戏中心</Link>
            <Link to="/blog-center" className="text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors">博客中心</Link>
            <Link to="/computing-power" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">个人中心</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/blog/create"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              写博客
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 */}
          <button
            onClick={handleBack}
            className="mb-6 flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回
          </button>
          
          {/* 博客内容 */}
          <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
            {/* 封面图 */}
            {post.coverImage && (
              <div className="w-full h-64 md:h-80">
                <img 
                  src={post.coverImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              {/* 标题和作者信息 */}
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{post.title}</h1>
              
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img 
                    src={post.authorAvatar || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a'} 
                    alt={post.authorName} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">{post.authorName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    发布于 {new Date(post.publishDate).toLocaleDateString('zh-CN')}
                    {post.lastUpdated && ` · 更新于 ${new Date(post.lastUpdated).toLocaleDateString('zh-CN')}`}
                  </div>
                </div>
              </div>
              
              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Link 
                    key={index}
                    to={`/blog-center?tag=${tag}`}
                    className="text-xs bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
              
              {/* 博客正文 */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {/* 使用Markdown渲染，这里简化处理，直接使用pre标签 */}
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: post.content
                      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                      .replace(/\n/g, '<br />')
                  }} 
                />
              </div>
              
              {/* 点赞和分享 */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-full ${
                      liked 
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                    }`}
                  >
                    <span>{liked ? '❤️' : '🤍'}</span>
                    <span>{post.likes + (liked ? 1 : 0)}</span>
                  </button>
                  
                  <div className="flex items-center space-x-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <span>👁️</span>
                    <span>{post.views}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                    <span>💬</span>
                    <span>{post.commentCount}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <span>📱</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30">
                    <span>💬</span>
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30">
                    <span>🔗</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
          
          {/* 评论区 */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-6">评论 ({comments.length})</h2>
            
            {/* 评论表单 */}
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src="https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a" 
                    alt={userData.username} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="写下你的评论..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    required
                  ></textarea>
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentContent.trim()}
                      className={`px-4 py-2 rounded-lg ${
                        submittingComment || !commentContent.trim()
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {submittingComment ? '提交中...' : '发表评论'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
            
            {/* 评论列表 */}
            {comments.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center">
                <div className="text-3xl mb-2">💬</div>
                <h3 className="text-lg font-medium mb-1">暂无评论</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  成为第一个评论的人吧！
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={comment.authorAvatar || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a'} 
                          alt={comment.authorName} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium">{comment.authorName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(comment.createdAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">
                          {comment.content}
                        </div>
                        <div className="flex items-center mt-2 text-sm">
                          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                            👍 {comment.likes}
                          </button>
                          <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
                          <button className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                            回复
                          </button>
                        </div>
                        
                        {/* 嵌套回复 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="pt-3">
                                <div className="flex items-start gap-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                    <img 
                                      src={reply.authorAvatar || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a'} 
                                      alt={reply.authorName} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="font-medium text-sm">{reply.authorName}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(reply.createdAt).toLocaleString('zh-CN')}
                                      </div>
                                    </div>
                                    <div className="text-sm text-slate-700 dark:text-slate-300">
                                      {reply.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-slate-900 text-slate-300 py-8">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-bold text-white">AllinONE</span>
          </div>
          <p className="text-slate-400 text-sm">
            © 2025 AllinONE. 保留所有权利。
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BlogDetail;