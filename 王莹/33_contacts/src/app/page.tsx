'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, type Contact } from '@/lib/supabase';

type ContactForm = {
  name: string;
  department: string;
  email: string;
  position: string;
  phone: string;
  hire_date: string;
  birthday: string;
  company: string;
  office_location: string;
  avatar_url: string;
  note: string;
};

const emptyForm: ContactForm = {
  name: '',
  department: '',
  email: '',
  position: '',
  phone: '',
  hire_date: '',
  birthday: '',
  company: '',
  office_location: '',
  avatar_url: '',
  note: '',
};

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const departments = useMemo(() => {
    const set = new Set(contacts.map((c) => c.department));
    return Array.from(set).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchText.trim() && !departmentFilter) return contacts;
    const keyword = searchText.trim().toLowerCase();
    return contacts.filter((c) => {
      if (departmentFilter && c.department !== departmentFilter) return false;
      if (!keyword) return true;
      return (
        c.name.toLowerCase().includes(keyword) ||
        c.department.toLowerCase().includes(keyword) ||
        c.email.toLowerCase().includes(keyword) ||
        (c.position ?? '').toLowerCase().includes(keyword) ||
        (c.phone ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [contacts, searchText, departmentFilter]);

  const isFiltering = searchText.trim() !== '' || departmentFilter !== '';

  function clearFilters() {
    setSearchText('');
    setDepartmentFilter('');
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setContacts(data ?? []);
    }
    setLoading(false);
  }

  function updateField(key: keyof ContactForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.department.trim() || !form.email.trim()) {
      setFormError('请填写必填字段：姓名、部门、邮箱');
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      department: form.department.trim(),
      email: form.email.trim(),
      position: form.position.trim() || null,
      phone: form.phone.trim() || null,
      hire_date: form.hire_date || null,
      birthday: form.birthday || null,
      company: form.company.trim() || null,
      office_location: form.office_location.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      note: form.note.trim() || null,
    };

    let result;
    if (editingId === null) {
      result = await supabase.from('contacts').insert(payload);
    } else {
      result = await supabase
        .from('contacts')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editingId);
    }

    setSubmitting(false);

    if (result.error) {
      if (result.error.code === '23505') {
        setFormError(`邮箱「${form.email}」已存在，请换一个`);
      } else {
        setFormError(`保存失败：${result.error.message}`);
      }
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    fetchContacts();
  }

  function handleEdit(contact: Contact) {
    setForm({
      name: contact.name,
      department: contact.department,
      email: contact.email,
      position: contact.position ?? '',
      phone: contact.phone ?? '',
      hire_date: contact.hire_date ?? '',
      birthday: contact.birthday ?? '',
      company: contact.company ?? '',
      office_location: contact.office_location ?? '',
      avatar_url: contact.avatar_url ?? '',
      note: contact.note ?? '',
    });
    setEditingId(contact.id);
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `确定要删除「${contact.name}」吗？\n\n此操作不可恢复。`
    );
    if (!confirmed) return;

    setDeletingId(contact.id);

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contact.id);

    setDeletingId(null);

    if (error) {
      alert(`删除失败：${error.message}`);
      return;
    }

    if (editingId === contact.id) {
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    }

    fetchContacts();
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">公司内部通讯录</h1>
            <p className="text-sm text-gray-500 mt-1">作品33 · Supabase CRUD 体验</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition"
            >
              + 添加联系人
            </button>
          )}
        </header>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId === null ? '添加联系人' : `编辑联系人 #${editingId}`}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="姓名" required value={form.name} onChange={(v) => updateField('name', v)} />
              <FormInput label="部门" required value={form.department} onChange={(v) => updateField('department', v)} />
              <FormInput label="邮箱" required type="email" value={form.email} onChange={(v) => updateField('email', v)} />
              <FormInput label="职位" value={form.position} onChange={(v) => updateField('position', v)} />
              <FormInput label="电话" value={form.phone} onChange={(v) => updateField('phone', v)} />
              <FormInput label="公司" value={form.company} onChange={(v) => updateField('company', v)} />
              <FormInput label="办公地" value={form.office_location} onChange={(v) => updateField('office_location', v)} />
              <FormInput label="入职日" type="date" value={form.hire_date} onChange={(v) => updateField('hire_date', v)} />
              <FormInput label="生日" type="date" value={form.birthday} onChange={(v) => updateField('birthday', v)} />
              <FormInput label="头像URL" value={form.avatar_url} onChange={(v) => updateField('avatar_url', v)} />
              <div className="md:col-span-2">
                <FormInput label="备注" value={form.note} onChange={(v) => updateField('note', v)} />
              </div>
            </div>

            {formError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="mt-5 flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (editingId === null ? '保存中...' : '更新中...')
                  : (editingId === null ? '保存' : '更新')}
              </button>
            </div>
          </form>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            加载中...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">读取数据失败</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && contacts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            暂无联系人。点击右上角「+ 添加联系人」开始。
          </div>
        )}

        {!loading && !error && contacts.length > 0 && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="🔍 搜索姓名 / 部门 / 邮箱 / 职位 / 电话..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">全部部门</option>
                  {departments.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
                {isFiltering && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    清空筛选
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              共 {contacts.length} 位联系人
              {isFiltering && ` · 筛选出 ${filteredContacts.length} 位`}
            </p>

            {filteredContacts.length === 0 && (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                无匹配联系人，换个关键词试试。
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {filteredContacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{c.name}</h2>
                      <p className="text-sm text-gray-600">
                        {c.department}
                        {c.position && ` · ${c.position}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">#{c.id}</span>
                      <button
                        onClick={() => handleEdit(c)}
                        disabled={deletingId !== null}
                        className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        disabled={deletingId !== null}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {deletingId === c.id ? '删除中...' : '删除'}
                      </button>
                    </div>
                  </div>

                  <dl className="mt-3 space-y-1 text-sm">
                    <Field label="📧 邮箱" value={c.email} />
                    <Field label="📱 电话" value={c.phone} />
                    <Field label="🏢 公司" value={c.company} />
                    <Field label="📍 办公地" value={c.office_location} />
                    <Field label="📅 入职日" value={c.hire_date} />
                    {c.note && <Field label="📝 备注" value={c.note} />}
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex">
      <dt className="w-20 text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm text-gray-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </label>
  );
}
