'use client';

import { useRef, useState, FormEvent } from 'react';
import Link from 'next/link';
import { supabase, ExpenseApplication } from '@/lib/supabase';

type ActionKey = 'submit' | 'accept' | 'approve' | 'reject';

type ActionConfig = {
  newStatus: ExpenseApplication['status'];
  label: string;
  buttonClass: string;
  title: string;
  commentRequired: boolean;
  commentPlaceholder: string;
};

const ACTIONS: Record<ActionKey, ActionConfig> = {
  submit: {
    newStatus: 'submitted',
    label: '📤 提交申请',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    title: '提交申请',
    commentRequired: false,
    commentPlaceholder: '可选：补充说明',
  },
  accept: {
    newStatus: 'reviewing',
    label: '📨 受理',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    title: '受理申请（进入审批）',
    commentRequired: false,
    commentPlaceholder: '可选：受理备注',
  },
  approve: {
    newStatus: 'approved',
    label: '✅ 通过',
    buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
    title: '审批通过',
    commentRequired: false,
    commentPlaceholder: '可选：审批意见',
  },
  reject: {
    newStatus: 'rejected',
    label: '❌ 驳回',
    buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
    title: '驳回申请',
    commentRequired: true,
    commentPlaceholder: '必填：驳回理由',
  },
};

type Props = {
  application: ExpenseApplication;
  onSuccess: () => void;
};

export function ActionPanel({ application, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentAction, setCurrentAction] = useState<ActionKey | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openDialog = (action: ActionKey) => {
    setCurrentAction(action);
    setOperatorName('');
    setComment('');
    setFormError(null);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    dialogRef.current?.close();
    setCurrentAction(null);
  };

  const handleConfirm = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!currentAction) return;
    const cfg = ACTIONS[currentAction];

    if (!operatorName.trim()) {
      setFormError('请填写操作人姓名');
      return;
    }
    if (cfg.commentRequired && !comment.trim()) {
      setFormError('请填写' + cfg.commentPlaceholder.replace('必填：', ''));
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const { error } = await supabase.rpc('expense_change_status', {
      p_application_id: application.id,
      p_new_status: cfg.newStatus,
      p_operator_name: operatorName.trim(),
      p_comment: comment.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      setFormError(`操作失败：${error.message}`);
      return;
    }

    closeDialog();
    onSuccess();
  };

  // 根据当前状态决定可用按钮
  const buttons = (() => {
    switch (application.status) {
      case 'draft':
        return (
          <>
            <Link
              href={`/applications/${application.id}/edit`}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold inline-flex items-center"
            >
              ✏️ 编辑
            </Link>
            <button
              onClick={() => openDialog('submit')}
              className={`${ACTIONS.submit.buttonClass} px-4 py-2 rounded font-semibold`}
            >
              {ACTIONS.submit.label}
            </button>
          </>
        );
      case 'submitted':
        return (
          <button
            onClick={() => openDialog('accept')}
            className={`${ACTIONS.accept.buttonClass} px-4 py-2 rounded font-semibold`}
          >
            {ACTIONS.accept.label}
          </button>
        );
      case 'reviewing':
        return (
          <>
            <button
              onClick={() => openDialog('approve')}
              className={`${ACTIONS.approve.buttonClass} px-4 py-2 rounded font-semibold`}
            >
              {ACTIONS.approve.label}
            </button>
            <button
              onClick={() => openDialog('reject')}
              className={`${ACTIONS.reject.buttonClass} px-4 py-2 rounded font-semibold`}
            >
              {ACTIONS.reject.label}
            </button>
          </>
        );
      case 'approved':
      case 'rejected':
        return (
          <p className="text-gray-500 italic text-sm">
            流程已结束（{application.status === 'approved' ? '已通过' : '已驳回'}），无可操作。
          </p>
        );
      default:
        return null;
    }
  })();

  const cfg = currentAction ? ACTIONS[currentAction] : null;

  return (
    <section className="border border-gray-200 rounded p-5 mb-8 bg-gray-50">
      <h2 className="text-lg font-bold mb-3">操作面板</h2>
      <div className="flex gap-3 flex-wrap">{buttons}</div>

      <dialog
        ref={dialogRef}
        className="rounded-lg p-0 backdrop:bg-black/40 max-w-md w-full"
        onClose={() => setCurrentAction(null)}
      >
        {cfg && (
          <form onSubmit={handleConfirm} className="p-6">
            <h3 className="text-lg font-bold mb-4">{cfg.title}</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                操作人姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入操作人姓名"
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">
                备注 {cfg.commentRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={cfg.commentPlaceholder}
                disabled={submitting}
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-300 rounded p-2 mb-3 text-red-800 text-sm">
                {formError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                className="border border-gray-400 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`${cfg.buttonClass} disabled:opacity-50 px-4 py-2 rounded font-semibold`}
              >
                {submitting ? '处理中…' : `确认${cfg.title}`}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
}
