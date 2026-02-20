import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getDict, t } from '@/utils/i18n';
import { Link } from 'react-router-dom';
import { useBlog } from '@/contexts/BlogContext';
import { BlogPost, BlogCategory } from '@/types/blog';

const BlogCenter: React.FC = () => {
  const { lang } = useLanguage();
  const dict = getDict(lang);
  const { 
    posts, 
    categories, 
    stats, 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    fetchPosts 
  } = useBlog();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 初始加载博客
  useEffect(() => {
    fetchPosts(1, 10);
  }, []);
  
  // 处理分类筛选
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedTag(''); // 重置标签筛选
    
    if (categoryId) {
      fetchPosts(1, 10, { category: categoryId });
    } else {
      fetchPosts(1, 10);
    }
  };
  
  // 处理标签筛选
  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSelectedCategory(''); // 重置分类筛选
    
    fetchPosts(1, 10, { tag });
  };
  
  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 这里简化处理，实际应该在服务端实现搜索
      fetchPosts(1, 10, { search: searchQuery });
    }
  };
  
  // 处理分页
  const handlePageChange = (page: number) => {
    const filter: any = {};
    if (selectedCategory) filter.category = selectedCategory;
    if (selectedTag) filter.tag = selectedTag;
    if (searchQuery) filter.search = searchQuery;
    
    fetchPosts(page, 10, filter);
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
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t(dict,'blog.header.home')}</Link>
            <Link to="/game-center" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t(dict,'blog.header.gameCenter')}</Link>
            <Link to="/blog-center" className="text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors">{t(dict,'blog.header.blogCenter')}</Link>
            <Link to="/computing-power" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t(dict,'blog.header.personalCenter')}</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/blog/create"
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
            >
              {t(dict,'blog.header.createBlog')}
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧边栏 */}
          <div className="lg:w-1/4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">{t(dict,'blog.sidebar.title')}</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                {t(dict,'blog.sidebar.desc')}
              </p>
              
              {/* 搜索框 */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t(dict,'blog.sidebar.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500"
                  >
                    🔍
                  </button>
                </div>
              </form>
              
              {/* 分类列表 */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">{t(dict,'blog.sidebar.categories')}</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => handleCategoryChange('')}
                      className={`w-full text-left px-2 py-1 rounded ${
                        selectedCategory === '' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {t(dict,'blog.sidebar.allCategories')}
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        onClick={() => handleCategoryChange(category.id)}
                        className={`w-full text-left px-2 py-1 rounded flex justify-between items-center ${
                          selectedCategory === category.id 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {category.postCount}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 热门标签 */}
              {stats && (
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-2">{t(dict,'blog.sidebar.popularTags')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.popularTags.map((tagInfo, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tagInfo.tag)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          selectedTag === tagInfo.tag
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {tagInfo.tag} ({tagInfo.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 博客统计 */}
              {stats && (
                <div>
                  <h3 className="font-bold text-lg mb-2">{t(dict,'blog.sidebar.stats')}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t(dict,'blog.sidebar.totalPosts')}</span>
                      <span className="font-medium">{stats.totalPosts}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t(dict,'blog.sidebar.totalViews')}</span>
                      <span className="font-medium">{stats.totalViews}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t(dict,'blog.sidebar.totalLikes')}</span>
                      <span className="font-medium">{stats.totalLikes}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">{t(dict,'blog.sidebar.totalComments')}</span>
                      <span className="font-medium">{stats.totalComments}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* 热门文章 */}
            {stats && stats.popularPosts.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6">
                <h3 className="font-bold text-lg mb-3">{lang === 'zh' ? '热门文章' : 'Popular Posts'}</h3>
                <ul className="space-y-3">
                  {stats.popularPosts.map((post, index) => (
                    <li key={post.id} className="border-b border-slate-100 dark:border-slate-700 pb-3 last:border-0 last:pb-0">
                      <Link 
                        to={`/blog/${post.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <div className="flex items-start gap-2">
                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 w-6 h-6 flex items-center justify-center rounded-full text-sm">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="font-medium line-clamp-2">{post.title}</h4>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {post.views} 次浏览
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* 右侧主内容 */}
          <div className="lg:w-3/4">
            {/* 筛选状态提示 */}
            {(selectedCategory || selectedTag || searchQuery) && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 mb-6 flex justify-between items-center">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {selectedCategory && <span>{lang === 'zh' ? '分类' : 'Category'}: {categories.find(c => c.id === selectedCategory)?.name}</span>}
                  {selectedTag && <span>{lang === 'zh' ? '标签' : 'Tag'}: {selectedTag}</span>}
                  {searchQuery && <span>{lang === 'zh' ? '搜索' : 'Search'}: "{searchQuery}"</span>}
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedTag('');
                    setSearchQuery('');
                    fetchPosts(1, 10);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t(dict,'blog.filterBar.clear')}
                </button>
              </div>
            )}
            
            {/* 博客列表 */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-xl font-bold mb-2">{t(dict,'blog.empty.title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {selectedCategory || selectedTag || searchQuery 
                    ? t(dict,'blog.empty.notFound') 
                    : t(dict,'blog.empty.encourage')}
                </p>
                <Link
                  to="/blog/create"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t(dict,'blog.empty.writeBlog')}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map(post => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            )}
            
            {/* 分页 */}
            {!loading && posts.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {t(dict,'blog.pagination.prev')}
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                    }`}
                  >
                    {t(dict,'blog.pagination.next')}
                  </button>
                </div>
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
            {t(dict,'about.footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
};

// 博客卡片组件
const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden">
      <div className="md:flex">
        {post.coverImage && (
          <div className="md:w-1/3 h-48 md:h-auto">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className={`p-6 ${post.coverImage ? 'md:w-2/3' : 'w-full'}`}>
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
              <img 
                src={post.authorAvatar || 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a'} 
                alt={post.authorName} 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">{post.authorName}</span>
            <span className="mx-2 text-slate-300 dark:text-slate-600">•</span>
            <span className="text-sm text-slate-500 dark:text-slate-500">
              {new Date(post.publishDate).toLocaleDateString('zh-CN')}
            </span>
          </div>
          
          <Link to={`/blog/${post.id}`} className="block group">
            <h2 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
              {post.summary}
            </p>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <span className="mr-1">👁️</span>
                <span>{post.views}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">❤️</span>
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">💬</span>
                <span>{post.commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCenter;