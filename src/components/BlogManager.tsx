import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useBlog } from '@/contexts/BlogContext';
import { BlogPost } from '@/types/blog';

const BlogManager: React.FC = () => {
  const navigate = useNavigate();
  const { userPosts, fetchUserPosts, deletePost, loading, error } = useBlog();
  
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  
  // 加载用户博客
  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);
  
  // 筛选已发布和草稿文章
  const publishedPosts = userPosts.filter(post => post.status === 'published');
  const draftPosts = userPosts.filter(post => post.status === 'draft');
  
  // 处理删除博客
  const handleDeleteClick = (post: BlogPost) => {
    setPostToDelete(post);
    setShowDeleteModal(true);
  };
  
  // 确认删除博客
  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      const success = await deletePost(postToDelete.id);
      if (success) {
        setShowDeleteModal(false);
        setPostToDelete(null);
      }
    } catch (err) {
      console.error('删除博客失败:', err);
    }
  };
  
  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPostToDelete(null);
  };
  
  // 编辑博客
  const handleEditPost = (post: BlogPost) => {
    navigate(`/blog/edit/${post.id}`);
  };
  
  return (
    <div className="bg-slate-800/80 border-2 border-green-400/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-400">📝 我的博客</h2>
        <Link
          to="/blog/create"
          className="bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-2 text-green-400 hover:bg-green-500/30 transition-all flex items-center gap-2"
        >
          写博客
        </Link>
      </div>
      
      {/* 标签切换 */}
      <div className="flex space-x-4 mb-6 border-b border-slate-600/30">
        <button
          onClick={() => setActiveTab('published')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'published'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          已发布 ({publishedPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('drafts')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'drafts'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          草稿 ({draftPosts.length})
        </button>
      </div>
      
      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-center text-red-400 mb-4">
          {error}
        </div>
      )}
      
      {/* 博客列表 */}
      {!loading && (
        <>
          {activeTab === 'published' && (
            <>
              {publishedPosts.length === 0 ? (
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6 text-center">
                  <div className="text-3xl mb-3">📝</div>
                  <h3 className="text-lg font-medium mb-2 text-slate-300">暂无已发布的博客</h3>
                  <p className="text-slate-400 mb-4">
                    分享你的游戏经验和平台使用心得，帮助其他玩家！
                  </p>
                  <Link
                    to="/blog/create"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    写第一篇博客
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedPosts.map(post => (
                    <BlogPostItem
                      key={post.id}
                      post={post}
                      onDelete={() => handleDeleteClick(post)}
                      onEdit={() => handleEditPost(post)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'drafts' && (
            <>
              {draftPosts.length === 0 ? (
                <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6 text-center">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="text-lg font-medium mb-2 text-slate-300">暂无草稿</h3>
                  <p className="text-slate-400">
                    你可以先将博客保存为草稿，稍后再完善发布。
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftPosts.map(post => (
                    <BlogPostItem
                      key={post.id}
                      post={post}
                      onDelete={() => handleDeleteClick(post)}
                      onEdit={() => handleEditPost(post)}
                      isDraft
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* 删除确认模态框 */}
      {showDeleteModal && postToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-red-400/30 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-red-400 mb-4">确认删除</h3>
            <p className="text-slate-300 mb-6">
              确定要删除博客 "{postToDelete.title}" 吗？此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 博客文章项组件
interface BlogPostItemProps {
  post: BlogPost;
  onDelete: () => void;
  onEdit: () => void;
  isDraft?: boolean;
}

const BlogPostItem: React.FC<BlogPostItemProps> = ({ post, onDelete, onEdit, isDraft = false }) => {
  return (
    <div className={`bg-slate-700/30 border ${isDraft ? 'border-yellow-400/30' : 'border-slate-600/30'} rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <Link to={`/blog/${post.id}`} className="block group">
            <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">
              {post.title}
              {isDraft && (
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                  草稿
                </span>
              )}
            </h3>
          </Link>
          <p className="text-slate-400 text-sm mb-2 line-clamp-2">
            {post.summary}
          </p>
          <div className="flex items-center text-xs text-slate-500">
            <span>
              {isDraft 
                ? `创建于 ${new Date(post.publishDate).toLocaleDateString('zh-CN')}` 
                : `发布于 ${new Date(post.publishDate).toLocaleDateString('zh-CN')}`}
            </span>
            {post.lastUpdated && (
              <>
                <span className="mx-1">•</span>
                <span>更新于 {new Date(post.lastUpdated).toLocaleDateString('zh-CN')}</span>
              </>
            )}
            {!isDraft && (
              <>
                <span className="mx-1">•</span>
                <span className="flex items-center">
                  <span className="mr-1">👁️</span>
                  {post.views}
                </span>
                <span className="mx-1">•</span>
                <span className="flex items-center">
                  <span className="mr-1">❤️</span>
                  {post.likes}
                </span>
                <span className="mx-1">•</span>
                <span className="flex items-center">
                  <span className="mr-1">💬</span>
                  {post.commentCount}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 bg-blue-500/20 border border-blue-400/30 rounded text-blue-400 hover:bg-blue-500/30"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-500/20 border border-red-400/30 rounded text-red-400 hover:bg-red-500/30"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogManager;