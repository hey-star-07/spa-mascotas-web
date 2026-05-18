'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { UserProfile, UserListResponse } from '@/types/user.types';
import { toast } from 'sonner';

export function useUsers() {
  const [loading, setLoading] = useState(false);

  const getUsers = async (params?: {
    page?: number;
    limit?: number;
    rol?: string;
    activo?: boolean;
    search?: string;
  }): Promise<UserListResponse> => {
    setLoading(true);
    try {
      const response = await api.get('/users', { params });
      return response.data.data;
    } catch (error: any) {
      toast.error('Error al cargar usuarios');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserById = async (id: number): Promise<UserProfile> => {
    setLoading(true);
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      toast.error('Error al cargar usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deactivateUser = async (id: number) => {
    setLoading(true);
    try {
      await api.put(`/users/${id}/deactivate`);
      toast.success('Usuario desactivado');
    } catch (error: any) {
      toast.error('Error al desactivar usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const reactivateUser = async (id: number) => {
    setLoading(true);
    try {
      await api.put(`/users/${id}/reactivate`);
      toast.success('Usuario reactivado');
    } catch (error: any) {
      toast.error('Error al reactivar usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { getUsers, getUserById, deactivateUser, reactivateUser, loading };
}