"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------- 类型定义 ----------
type Post = {
  id: number;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  author_email?: string;
};

type Comment = {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_email?: string;
};

// ---------- 工具函数 ----------
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(uid: string) {
  return uid.slice(0, 6).toUpperCase();
}

// ============================================================
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  // 认证表单
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 发帖表单
  const [showPostForm, setShowPostForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 编辑表单
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // 评论
  const [newComment, setNewComment] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---------- 初期化 ----------
  useEffect(() => {
    // 获取当前登录状态
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // 监听登录/登出变化
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchPosts();

    return () => listener.subscription.unsubscribe();
  }, []);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ---------- 获取帖子列表 ----------
  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  // ---------- 获取评论 ----------
  const fetchComments = async (postId: number) => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
  };

  // ---------- 选择帖子 ----------
  const handleSelectPost = (post: Post) => {
    setSelected(post);
    setEditingPost(null);
    setNewComment("");
    fetchComments(post.id);
  };

  // ---------- 注册 ----------
  const handleRegister = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showMsg("注册失败：" + error.message);
    } else {
      showMsg("注册成功！已自动登录");
      setShowAuth(false);
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  // ---------- 登录 ----------
  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showMsg("登录失败：邮箱或密码错误");
    } else {
      showMsg("登录成功！");
      setShowAuth(false);
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  // ---------- 登出 ----------
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelected(null);
    showMsg("已登出");
  };

  // ---------- 发帖 ----------
  const handlePost = async () => {
    if (!user) return;
    if (!newTitle.trim() || !newContent.trim()) {
      showMsg("标题和内容不能为空");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    if (error) {
      showMsg("发帖失败：" + error.message);
    } else {
      showMsg("发帖成功！");
      setNewTitle("");
      setNewContent("");
      setShowPostForm(false);
      fetchPosts();
    }
    setLoading(false);
  };

  // ---------- 编辑帖子 ----------
  const handleEditPost = async () => {
    if (!editingPost) return;
    if (!editTitle.trim() || !editContent.trim()) {
      showMsg("标题和内容不能为空");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("posts")
      .update({ title: editTitle.trim(), content: editContent.trim() })
      .eq("id", editingPost.id);
    if (error) {
      showMsg("编辑失败：" + error.message);
    } else {
      showMsg("编辑成功！");
      const updated = { ...editingPost, title: editTitle, content: editContent };
      setSelected(updated);
      setEditingPost(null);
      fetchPosts();
    }
    setLoading(false);
  };

  // ---------- 删除帖子 ----------
  const handleDeletePost = async (post: Post) => {
    if (!confirm(`确定删除「${post.title}」？`)) return;
    setLoading(true);
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      showMsg("删除失败：" + error.message);
    } else {
      showMsg("已删除");
      setSelected(null);
      fetchPosts();
    }
    setLoading(false);
  };

  // ---------- 发评论 ----------
  const handleComment = async () => {
    if (!user || !selected) return;
    if (!newComment.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      post_id: selected.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      showMsg("评论失败：" + error.message);
    } else {
      setNewComment("");
      fetchComments(selected.id);
    }
    setLoading(false);
  };

  // ---------- 删除评论 ----------
  const handleDeleteComment = async (commentId: number) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (!error && selected) fetchComments(selected.id);
  };

  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">公司内部公告板</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-500">{user.email}</span>
                <button
                  onClick={() => { setShowPostForm(!showPostForm); setEditingPost(null); }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  ＋ 发帖
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-500 border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
                >
                  登出
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 登录/注册弹窗 */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            {/* 切换标签 */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setAuthMode("login")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  authMode === "login"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setAuthMode("register")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  authMode === "register"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                注册
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="password"
                placeholder="密码（6位以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (authMode === "login" ? handleLogin() : handleRegister())
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={authMode === "login" ? handleLogin : handleRegister}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {authMode === "login" ? "登录" : "注册"}
              </button>
              <button
                onClick={() => { setShowAuth(false); setEmail(""); setPassword(""); }}
                className="w-full text-gray-400 text-sm hover:text-gray-600"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* 提示消息 */}
        {message && (
          <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* 发帖表单 */}
        {showPostForm && user && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-700 mb-3">发新帖</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="标题"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="内容"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePost}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  发布
                </button>
                <button
                  onClick={() => setShowPostForm(false)}
                  className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
            登录后才能发帖和评论。现在可以浏览所有帖子。
          </div>
        )}

        <div className="flex gap-6">
          {/* 左：帖子列表 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-3">共 {posts.length} 篇帖子</p>
            <div className="space-y-2">
              {posts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  暂无帖子，登录后发第一篇吧！
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={`bg-white border rounded-xl px-4 py-3 cursor-pointer hover:border-blue-300 transition-colors ${
                      selected?.id === post.id
                        ? "border-blue-500 shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(post.created_at)} ·{" "}
                          {user?.id === post.user_id ? (
                            <span className="text-blue-500">你</span>
                          ) : (
                            `用户 ${shortId(post.user_id)}`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右：帖子详情 + 评论 */}
          {selected && (
            <div className="w-96 flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                {/* 编辑模式 */}
                {editingPost ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
                    />
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditPost}
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setEditingPost(null)}
                        className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-200"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 帖子内容 */}
                    <div className="flex items-start justify-between mb-1">
                      <h2 className="font-bold text-gray-800 text-lg flex-1">
                        {selected.title}
                      </h2>
                      {/* 自己的帖子才显示编辑/删除 */}
                      {user?.id === selected.user_id && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingPost(selected);
                              setEditTitle(selected.title);
                              setEditContent(selected.content);
                            }}
                            className="text-xs text-gray-400 hover:text-blue-500 px-2 py-1"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDeletePost(selected)}
                            className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                      {formatDate(selected.created_at)} ·{" "}
                      {user?.id === selected.user_id
                        ? "你"
                        : `用户 ${shortId(selected.user_id)}`}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selected.content}
                    </p>
                  </>
                )}

                {/* 评论区 */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">
                    评论 ({comments.length})
                  </h3>

                  {/* 评论列表 */}
                  <div className="space-y-3 mb-4">
                    {comments.length === 0 ? (
                      <p className="text-xs text-gray-400">暂无评论</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-700 flex-1">
                              {comment.content}
                            </p>
                            {/* 自己的评论才显示删除 */}
                            {user?.id === comment.user_id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-gray-300 hover:text-red-400 ml-2"
                              >
                                删除
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(comment.created_at)} ·{" "}
                            {user?.id === comment.user_id
                              ? "你"
                              : `用户 ${shortId(comment.user_id)}`}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 发评论 */}
                  {user ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="写评论..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleComment()}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        onClick={handleComment}
                        disabled={loading}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        发送
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">
                      <button
                        onClick={() => setShowAuth(true)}
                        className="text-blue-500 hover:underline"
                      >
                        登录
                      </button>
                      后才能评论
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
