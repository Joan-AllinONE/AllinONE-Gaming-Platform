import { BlogPost, BlogComment, BlogCategory, BlogStats } from '@/types/blog';
import { sampleBlogPost, sampleComments, sampleBlogPosts } from '@/data/sampleBlogPost';

// --- LocalStorage Persistence ---
const POSTS_KEY = 'blogPosts';
const COMMENTS_KEY = 'blogComments';

const loadFromLocalStorage = <T>(key: string, defaults: T[], dateFields: string[] = []): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored).map((item: any) => {
        const newItem = { ...item };
        dateFields.forEach(field => {
          if (newItem[field]) {
            newItem[field] = new Date(newItem[field]);
          }
        });
        return newItem;
      });
    }
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
  }
  return defaults;
};

const saveToLocalStorage = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
};
// --- End LocalStorage Persistence ---


// 模拟博客数据
const defaultBlogPosts: BlogPost[] = [
  sampleBlogPost,
  {
    id: '1',
    title: 'AllinONE平台使用体验：游戏与收益的完美结合',
    content: `
# AllinONE平台使用体验：游戏与收益的完美结合

## 初次接触

作为一名资深游戏爱好者，我一直在寻找能够将游戏乐趣与实际收益相结合的平台。当我第一次听说AllinONE平台时，我抱着怀疑的态度注册了账号。毕竟，市面上声称"边玩边赚"的平台不在少数，但真正能够提供良好体验和稳定收益的却寥寥无几。

## 平台特色

AllinONE最吸引我的是其创新的双代币经济系统。平台使用游戏币和算力积分两种虚拟资产，相互配合形成了一个完整的经济循环。这种设计既符合国内的合规要求，又能为玩家提供实际的收益机会。

### 游戏体验

平台上的小游戏种类丰富，从休闲益智到竞技对战，应有尽有。我个人最喜欢的是三消类游戏，操作简单但策略性强，非常适合利用碎片时间进行游戏。游戏画面精美，操作流畅，完全不输专业游戏平台的体验。

### 收益机制

通过游戏获得的算力是平台收益的核心。我发现，持续稳定地参与游戏比短时间内高强度游戏更有利于算力的积累。平台的算力分配机制非常透明，你可以在个人中心清晰地看到每一笔算力的来源和用途。

## 社区互动

AllinONE的社区氛围非常活跃。玩家之间可以组队游戏、交流策略，甚至进行道具交易。这种社交元素大大增强了平台的粘性，让我不仅仅是为了收益而来，更是享受其中的社交乐趣。

## 收益分析

使用一个月后，我的收益情况如下：
- 日均游戏时间：约1小时
- 月累计算力：约30点
- 月收益：约150元

考虑到我只是利用空闲时间进行游戏，这样的收益已经相当可观。当然，如果你能投入更多时间，或者发展团队，收益还会更高。

## 改进建议

虽然整体体验很好，但我认为平台还有一些可以改进的地方：
1. 游戏种类可以进一步丰富，特别是策略类和角色扮演类游戏
2. 提现流程可以再简化一些，目前需要3-5个工作日
3. 移动端APP的稳定性有待提高，偶尔会出现闪退情况

## 总结

AllinONE是一个将游戏娱乐与收益机会完美结合的平台。它既满足了游戏爱好者的娱乐需求，又提供了合规、透明的收益渠道。如果你是一个喜欢游戏，又希望能从中获得一些额外收入的人，我强烈推荐你尝试AllinONE平台。

记住，平台的核心理念是"寓教于乐，寓赚于乐"，保持一个轻松的心态，享受游戏的过程，收益自然会随之而来。
    `,
    summary: 'AllinONE平台将游戏乐趣与收益机会完美结合，通过创新的双代币经济系统和丰富的游戏内容，为玩家提供了一个既有趣又有收益的游戏平台。',
    coverImage: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=game%20dashboard%2C%20interface%20showing%20gaming%20stats%2C%20virtual%20currency%2C%20modern%20UI%2C%20blue%20theme&sign=a160cbc38262558651adba1662dee0ce',
    authorId: 'current-user',
    authorName: '游戏玩家',
    authorAvatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%2C%20cartoon%20style%2C%20friendly&sign=a9cc8cbd767adbae39edf6cb5d2f386a',
    publishDate: new Date('2025-09-10'),
    tags: ['游戏体验', '收益分析', '平台评测'],
    likes: 42,
    views: 156,
    commentCount: 8,
    status: 'published'
  },
  {
    id: '2',
    title: '如何在AllinONE平台最大化你的算力收益',
    content: `
# 如何在AllinONE平台最大化你的算力收益

作为一名在AllinONE平台活跃了3个月的玩家，我总结了一些提高算力收益的实用技巧，希望对新玩家有所帮助。

## 理解算力机制

首先，了解算力的获取和计算方式至关重要。在AllinONE平台，算力主要来源于：
- 日常游戏表现
- 完成平台任务
- 社区活动参与
- 团队协作贡献

其中，游戏表现是最基础也是最稳定的算力来源。

## 游戏选择策略

不同的游戏提供的算力回报是不同的。根据我的经验，以下游戏算力效率较高：

1. **三消类游戏** - 操作简单，单局时间短，适合碎片时间
2. **益智解谜** - 难度适中，算力奖励丰厚
3. **竞技对战** - 胜率越高，算力奖励越多

建议新手从三消类游戏开始，熟悉平台后再尝试其他类型。

## 时间管理

合理安排游戏时间也是提高算力效率的关键。我的建议是：

- 每天固定时间段游戏，保持算力增长的稳定性
- 利用平台"黄金时段"（通常是晚上8-10点）游戏，此时算力奖励有额外加成
- 不要疲劳游戏，质量比数量更重要

## 团队合作

加入或组建一个活跃的团队可以显著提升你的算力收益。团队成员之间的算力有联动效应，团队整体活跃度越高，每个成员获得的算力加成也越多。

## 任务与活动

平台经常会推出各种任务和活动，这些是获取额外算力的绝佳机会：

- 每日任务必做，这是最基础的算力来源
- 参与限时活动，通常有双倍甚至三倍算力奖励
- 关注社区公告，及时了解新的算力获取渠道

## 道具利用

合理使用游戏道具可以提高游戏效率，间接提升算力获取速度：

- "算力加速器"可在短时间内提升30%的算力获取
- "游戏币转换器"可以将多余的游戏币转换为少量算力
- "任务刷新卡"可以刷新难度较大的任务，换取更容易完成的任务

## 收益转化

最后，如何将算力转化为实际收益也很重要：

- 定期将算力兑换为平台币或游戏币
- 根据市场行情，选择最有利的兑换时机
- 考虑长期持有部分算力，享受算力增值

## 总结

在AllinONE平台，提高算力收益需要综合考虑游戏选择、时间管理、团队合作等多方面因素。希望这些技巧对你有所帮助，祝你在平台上玩得开心，赚得满意！

记住，持之以恒是成功的关键。即使是每天只玩一小时，只要坚持下去，也能积累可观的算力收益。
    `,
    summary: '本文分享了在AllinONE平台提高算力收益的实用技巧，包括游戏选择策略、时间管理、团队合作等多个方面的建议。',
    coverImage: 'https://space.coze.cn/api/coze_space/gen_image?image_size=landscape_16_9&prompt=gaming%20strategy%2C%20charts%20and%20graphs%2C%20optimization%2C%20modern%20UI%2C%20blue%20and%20purple%20theme&sign=a160cbc38262558651adba1662dee0ce',
    authorId: 'user-2',
    authorName: '算力达人',
    authorAvatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=professional%20gamer%20avatar%2C%20cartoon%20style%2C%20tech%20savvy&sign=a9cc8cbd767adbae39edf6cb5d2f386a',
    publishDate: new Date('2025-09-05'),
    tags: ['算力攻略', '游戏技巧', '收益优化'],
    likes: 78,
    views: 245,
    commentCount: 12,
    status: 'published'
  }
];
let blogPosts: BlogPost[] = loadFromLocalStorage<BlogPost>(POSTS_KEY, defaultBlogPosts, ['publishDate', 'lastUpdated']);


// 模拟评论数据
const defaultBlogComments: BlogComment[] = [
  ...sampleComments,
  {
    id: '1',
    postId: '1',
    content: '非常详细的平台介绍，我也是AllinONE的用户，完全认同你的观点！',
    authorId: 'user-2',
    authorName: '算力达人',
    authorAvatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=professional%20gamer%20avatar%2C%20cartoon%20style%2C%20tech%20savvy&sign=a9cc8cbd767adbae39edf6cb5d2f386a',
    createdAt: new Date('2025-09-11'),
    likes: 5
  },
  {
    id: '2',
    postId: '1',
    content: '请问作者每天大概玩多久才能获得这样的收益？我是新手，想了解一下时间投入。',
    authorId: 'user-3',
    authorName: '游戏新手',
    authorAvatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=newbie%20gamer%20avatar%2C%20cartoon%20style%2C%20curious&sign=a9cc8cbd767adbae39edf6cb5d2f386a',
    createdAt: new Date('2025-09-12'),
    likes: 2
  },
  {
    id: '3',
    postId: '1',
    content: '我觉得平台的游戏种类还可以再丰富一些，特别是策略类游戏。',
    authorId: 'user-4',
    authorName: '策略游戏爱好者',
    authorAvatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=strategy%20gamer%20avatar%2C%20cartoon%20style%2C%20thoughtful&sign=a9cc8cbd767adbae39edf6cb5d2f386a',
    createdAt: new Date('2025-09-13'),
    likes: 3
  }
];
let blogComments: BlogComment[] = loadFromLocalStorage<BlogComment>(COMMENTS_KEY, defaultBlogComments, ['createdAt']);

// Initialize localStorage if empty
if (!localStorage.getItem(POSTS_KEY)) {
  saveToLocalStorage(POSTS_KEY, blogPosts);
}
if (!localStorage.getItem(COMMENTS_KEY)) {
  saveToLocalStorage(COMMENTS_KEY, blogComments);
}


// 模拟博客分类数据
let blogCategories: BlogCategory[] = [
  {
    id: '1',
    name: '平台体验',
    description: '分享AllinONE平台的使用体验和心得',
    postCount: 5
  },
  {
    id: '2',
    name: '游戏攻略',
    description: '各类游戏的攻略和技巧分享',
    postCount: 8
  },
  {
    id: '3',
    name: '收益分析',
    description: '平台收益机制分析和收益提升方法',
    postCount: 6
  },
  {
    id: '4',
    name: '社区活动',
    description: '平台社区活动公告和回顾',
    postCount: 3
  },
  {
    id: '5',
    name: '算力优化',
    description: '算力获取和优化的方法与技巧',
    postCount: 7
  },
  {
    id: '6',
    name: '团队建设',
    description: '如何组建和管理高效的游戏团队',
    postCount: 4
  },
  {
    id: '7',
    name: '新手指南',
    description: '为平台新用户提供的入门指导',
    postCount: 5
  }
];

// 博客服务
export const blogService = {
  // 获取博客列表
  async getBlogPosts(page: number = 1, limit: number = 10, filter?: {
    tag?: string,
    category?: string,
    authorId?: string,
    status?: 'draft' | 'published'
  }): Promise<{posts: BlogPost[], total: number}> {
    let filteredPosts = [...blogPosts];
    
    // 应用过滤条件
    if (filter) {
      if (filter.tag) {
        filteredPosts = filteredPosts.filter(post => post.tags.includes(filter.tag!));
      }
      if (filter.authorId) {
        filteredPosts = filteredPosts.filter(post => post.authorId === filter.authorId);
      }
      if (filter.status) {
        filteredPosts = filteredPosts.filter(post => post.status === filter.status);
      }
    }
    
    // 默认只返回已发布的文章
    if (!filter?.status) {
      filteredPosts = filteredPosts.filter(post => post.status === 'published');
    }
    
    // 按发布日期降序排序
    filteredPosts.sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
    
    // 分页
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPosts = filteredPosts.slice(start, end);
    
    return {
      posts: paginatedPosts,
      total: filteredPosts.length
    };
  },
  
  // 获取单篇博客详情
  async getBlogPost(id: string): Promise<BlogPost | null> {
    const post = blogPosts.find(post => post.id === id);
    if (post) {
      // 增加浏览量
      post.views += 1;
      saveToLocalStorage(POSTS_KEY, blogPosts);
      return { ...post };
    }
    return null;
  },
  
  // 创建博客
  async createBlogPost(post: Omit<BlogPost, 'id' | 'publishDate' | 'likes' | 'views' | 'commentCount'>): Promise<BlogPost> {
    const newPost: BlogPost = {
      ...post,
      id: Date.now().toString(),
      publishDate: new Date(),
      likes: 0,
      views: 0,
      commentCount: 0
    };
    
    blogPosts.unshift(newPost);
    saveToLocalStorage(POSTS_KEY, blogPosts);
    return newPost;
  },
  
  // 更新博客
  async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const postIndex = blogPosts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;
    
    const updatedPost = {
      ...blogPosts[postIndex],
      ...updates,
      lastUpdated: new Date()
    };
    
    blogPosts[postIndex] = updatedPost;
    saveToLocalStorage(POSTS_KEY, blogPosts);
    return updatedPost;
  },
  
  // 删除博客
  async deleteBlogPost(id: string): Promise<boolean> {
    const initialLength = blogPosts.length;
    blogPosts = blogPosts.filter(post => post.id !== id);
    const success = blogPosts.length < initialLength;
    if (success) {
      saveToLocalStorage(POSTS_KEY, blogPosts);
    }
    return success;
  },
  
  // 点赞博客
  async likeBlogPost(id: string): Promise<BlogPost | null> {
    const post = blogPosts.find(post => post.id === id);
    if (!post) return null;
    
    post.likes += 1;
    saveToLocalStorage(POSTS_KEY, blogPosts);
    return { ...post };
  },
  
  // 获取博客评论
  async getBlogComments(postId: string): Promise<BlogComment[]> {
    return blogComments.filter(comment => comment.postId === postId);
  },
  
  // 添加评论
  async addComment(comment: Omit<BlogComment, 'id' | 'createdAt' | 'likes'>): Promise<BlogComment> {
    const newComment: BlogComment = {
      ...comment,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0
    };
    
    blogComments.unshift(newComment);
    saveToLocalStorage(COMMENTS_KEY, blogComments);
    
    // 更新博客评论计数
    const post = blogPosts.find(post => post.id === comment.postId);
    if (post) {
      post.commentCount += 1;
      saveToLocalStorage(POSTS_KEY, blogPosts);
    }
    
    return newComment;
  },
  
  // 获取博客分类
  async getBlogCategories(): Promise<BlogCategory[]> {
    return [...blogCategories];
  },
  
  // 获取博客统计数据
  async getBlogStats(): Promise<BlogStats> {
    // 计算总浏览量
    const totalViews = blogPosts.reduce((sum, post) => sum + post.views, 0);
    
    // 计算总点赞数
    const totalLikes = blogPosts.reduce((sum, post) => sum + post.likes, 0);
    
    // 计算总评论数
    const totalComments = blogPosts.reduce((sum, post) => sum + post.commentCount, 0);
    
    // 计算热门标签
    const tagCounts: Record<string, number> = {};
    blogPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // 获取热门文章
    const popularPosts = [...blogPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map(post => ({
        id: post.id,
        title: post.title,
        views: post.views
      }));
    
    return {
      totalPosts: blogPosts.length,
      totalViews,
      totalLikes,
      totalComments,
      popularTags,
      popularPosts
    };
  }
};