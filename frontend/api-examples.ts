import { client, readUsersApiV1UsersGet } from './src/client'

// 示例：获取用户列表
const getUsers = async () => {
  try {
    const response = await readUsersApiV1UsersGet({ client })
    console.log('用户列表:', response.data)
    return response.data
  } catch (error) {
    console.error('获取用户失败:', error)
    throw error
  }
}

// 示例：登录获取token
import { loginAccessTokenApiV1LoginAccessTokenPost } from './src/client'

const login = async (username: string, password: string) => {
  try {
    const response = await loginAccessTokenApiV1LoginAccessTokenPost({
      client,
      body: {
        grant_type: 'password',
        username,
        password,
      },
    })

    // 保存token到localStorage
    if (response.data?.access_token) {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
    }

    return response.data
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

// 示例：在React组件中使用
/*
import React, { useEffect, useState } from 'react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const userData = await getUsers();
        setUsers(userData);
      } catch (error) {
        // 处理错误
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      // 渲染用户列表
    </div>
  );
};
*/

export { getUsers, login }
