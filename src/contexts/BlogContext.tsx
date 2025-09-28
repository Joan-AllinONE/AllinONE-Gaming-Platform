import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BlogPost, BlogComment, BlogCategory, BlogStats } from '@/types/blog';
import { blogService } from '@/services/blogService';
import { useUserData } from './UserDataContext';

interface BlogContextType {
  posts: BlogPost[];
  userPosts: BlogPost[];
  categories: BlogCategory[];
  stats: BlogStats | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  fetchPosts: (page?: number, limit?: number, filter?: any) => Promise<void>;
  fetchUserPosts: () => Promise<void>;
  fetchPostById: (id: string) => Promise<BlogPost | null>;
  createPost: (post: Omit<BlogPost, 'id' | 'publishDate' | 'likes' | 'views' | 'commentCount'>) => Promise<BlogPost>;
  updatePost: (id: string, updates: Partial<BlogPost>) => Promise<BlogPost | null>;
  deletePost: (id: string) => Promise<boolean>;
  likePost: (id: string) => Promise<BlogPost | null>;
  fetchComments: (postId: string) => Promise<BlogComment[]>;
  addComment: (comment: Omit<BlogComment, 'id' | 'createdAt' | 'likes'>) => Promise<BlogComment>;
  refreshStats: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function BlogProvider({ children }: { children: ReactNode }) {
  const { userData } = useUserData();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [userPosts, setUserPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // 获取博客分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await blogService.getBlogCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('获取博客分类失败:', err);
        setError('获取博客分类失败');
      }
    };
    
    fetchCategories();
  }, []);
  
  // 获取博客统计数据
  useEffect(() => {
    refreshStats();
  }, []);
  
  // 获取博客列表
  const fetchPosts = useCallback(async (page: number = 1, limit: number = 10, filter?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await blogService.getBlogPosts(page, limit, filter);
      setPosts(result.posts);
      setCurrentPage(page);
      setTotalPages(Math.ceil(result.total / limit));
    } catch (err) {
      console.error('获取博客列表失败:', err);
      setError('获取博客列表失败');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 获取用户自己的博客
  const fetchUserPosts = useCallback(async () => {
    if (!userData.userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await blogService.getBlogPosts(1, 100, { 
        authorId: userData.userId,
        status: undefined // 获取所有状态的文章，包括草稿
      });
      setUserPosts(result.posts);
    } catch (err) {
      console.error('获取用户博客失败:', err);
      setError('获取用户博客失败');
    } finally {
      setLoading(false);
    }
  }, [userData.userId]);
  
  // 获取单篇博客
  const fetchPostById = useCallback(async (id: string): Promise<BlogPost | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const post = await blogService.getBlogPost(id);
      return post;
    } catch (err) {
      console.error('获取博客详情失败:', err);
      setError('获取博客详情失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 创建博客
  const createPost = useCallback(async (post: Omit<BlogPost, 'id' | 'publishDate' | 'likes' | 'views' | 'commentCount'>): Promise<BlogPost> => {
    setLoading(true);
    setError(null);
    
    try {
      const newPost = await blogService.createBlogPost(post);
      
      // 如果是已发布状态，更新博客列表
      if (newPost.status === 'published') {
        setPosts(prevPosts => [newPost, ...prevPosts]);
      }
      
      // 更新用户博客列表
      setUserPosts(prevPosts => [newPost, ...prevPosts]);
      
      return newPost;
    } catch (err) {
      console.error('创建博客失败:', err);
      setError('创建博客失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 更新博客
  const updatePost = useCallback(async (id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPost = await blogService.updateBlogPost(id, updates);
      
      if (updatedPost) {
        // 更新博客列表
        setPosts(prevPosts => 
          prevPosts.map(post => post.id === id ? updatedPost : post)
        );
        
        // 更新用户博客列表
        setUserPosts(prevPosts => 
          prevPosts.map(post => post.id === id ? updatedPost : post)
        );
      }
      
      return updatedPost;
    } catch (err) {
      console.error('更新博客失败:', err);
      setError('更新博客失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 删除博客
  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await blogService.deleteBlogPost(id);
      
      if (success) {
        // 从博客列表中移除
        setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
        
        // 从用户博客列表中移除
        setUserPosts(prevPosts => prevPosts.filter(post => post.id !== id));
      }
      
      return success;
    } catch (err) {
      console.error('删除博客失败:', err);
      setError('删除博客失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 点赞博客
  const likePost = useCallback(async (id: string): Promise<BlogPost | null> => {
    try {
      const updatedPost = await blogService.likeBlogPost(id);
      
      if (updatedPost) {
        // 更新博客列表
        setPosts(prevPosts => 
          prevPosts.map(post => post.id === id ? updatedPost : post)
        );
      }
      
      return updatedPost;
    } catch (err) {
      console.error('点赞博客失败:', err);
      return null;
    }
  }, []);
  
  // 获取博客评论
  const fetchComments = useCallback(async (postId: string): Promise<BlogComment[]> => {
    try {
      return await blogService.getBlogComments(postId);
    } catch (err) {
      console.error('获取评论失败:', err);
      return [];
    }
  }, []);
  
  // 添加评论
  const addComment = useCallback(async (comment: Omit<BlogComment, 'id' | 'createdAt' | 'likes'>): Promise<BlogComment> => {
    try {
      const newComment = await blogService.addComment(comment);
      
      // 更新博客评论计数
      const postId = comment.postId;
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return { ...post, commentCount: post.commentCount + 1 };
          }
          return post;
        })
      );
      
      return newComment;
    } catch (err) {
      console.error('添加评论失败:', err);
      throw err;
    }
  }, []);
  
  // 刷新统计数据
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await blogService.getBlogStats();
      setStats(statsData);
    } catch (err) {
      console.error('获取博客统计数据失败:', err);
    }
  }, []);
  
  return (
    <BlogContext.Provider
      value={{
        posts,
        userPosts,
        categories,
        stats,
        loading,
        error,
        currentPage,
        totalPages,
        fetchPosts,
        fetchUserPosts,
        fetchPostById,
        createPost,
        updatePost,
        deletePost,
        likePost,
        fetchComments,
        addComment,
        refreshStats
      }}
    >
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}