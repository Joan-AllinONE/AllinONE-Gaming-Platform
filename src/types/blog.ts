// 博客相关类型定义

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  coverImage?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  publishDate: Date;
  lastUpdated?: Date;
  tags: string[];
  likes: number;
  views: number;
  commentCount: number;
  status: 'draft' | 'published';
}

export interface BlogComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  likes: number;
  replies?: BlogComment[];
  parentCommentId?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  description: string;
  postCount: number;
}

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  popularTags: Array<{tag: string, count: number}>;
  popularPosts: Array<{id: string, title: string, views: number}>;
}