import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import type { Record } from '../types/record';
import * as recordService from '../services/recordService';
import { useAuth } from './useAuth';

export function useRecords() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const refresh = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await recordService.fetchRecords();
      setRecords(data);
    } catch (err) {
      message.error('加载数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRecord = useCallback(async (record: Omit<Record, 'id' | 'created_at' | 'updated_at' | 'creator_name'>) => {
    try {
      await recordService.createRecord(record);
      message.success('新增成功');
      await refresh();
    } catch (err) {
      message.error('新增失败');
      console.error(err);
    }
  }, [refresh]);

  const updateRecord = useCallback(async (id: string, updates: Partial<Record>) => {
    try {
      await recordService.updateRecord(id, updates);
      message.success('更新成功');
      await refresh();
    } catch (err) {
      message.error('更新失败');
      console.error(err);
    }
  }, [refresh]);

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await recordService.deleteRecord(id);
      message.success('删除成功');
      await refresh();
    } catch (err) {
      message.error('删除失败');
      console.error(err);
    }
  }, [refresh]);

  return { records, loading, refresh, createRecord, updateRecord, deleteRecord };
}
