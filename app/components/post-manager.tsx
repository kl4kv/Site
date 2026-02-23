'use client'

import { useState, useCallback, useEffect } from 'react'
import { ImageUploader } from '@/components/image-uploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Plus, Save, Trash2, Edit, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Credit {
  label: string
  value: string
}

interface Post {
  id?: number
  title: string
  slug: string
  content: string
  excerpt: string
  cover_image_url: string
  cover_image_path: string
  published: boolean
  credits: Credit[]
  created_at?: string
}

const emptyPost: Post = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  cover_image_url: '',
  cover_image_path: '',
  published: false,
  credits: [
    { label: 'Локация', value: '' },
    { label: 'Дата', value: '' },
    { label: 'Категория', value: '' },
    { label: 'Фото', value: '' },
  ],
}

export function PostManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentPost, setCurrentPost] = useState<Post>(emptyPost)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Загрузка пользователя и постов
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      
      // Получаем пользователя
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Загружаем посты
      await loadPosts()
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  const loadPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/blog-posts')
      const result = await response.json()
      
      if (result.success) {
        setPosts(result.data.map((post: any) => ({
          ...post,
          cover_image_url: post.cover_image ? 
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${post.cover_image.replace('/images/', '')}` 
            : '',
          cover_image_path: post.cover_image?.replace('/images/', '') || '',
        })))
      }
    } catch (err) {
      console.error('Load posts error:', err)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.reload()
  }, [])

  const handleImageUploaded = useCallback((url: string, filePath: string) => {
    setCurrentPost(prev => ({
      ...prev,
      cover_image_url: url,
      cover_image_path: filePath,
    }))
  }, [])

  const handleCreditChange = useCallback((index: number, field: 'label' | 'value', value: string) => {
    setCurrentPost(prev => ({
      ...prev,
      credits: prev.credits.map((credit, i) => 
        i === index ? { ...credit, [field]: value } : credit
      ),
    }))
  }, [])

  const handleAddCredit = useCallback(() => {
    setCurrentPost(prev => ({
      ...prev,
      credits: [...prev.credits, { label: '', value: '' }],
    }))
  }, [])

  const handleRemoveCredit = useCallback((index: number) => {
    setCurrentPost(prev => ({
      ...prev,
      credits: prev.credits.filter((_, i) => i !== index),
    }))
  }, [])

  const handleSavePost = useCallback(async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentPost,
          cover_image: currentPost.cover_image_path 
            ? `/images/${currentPost.cover_image_path}` 
            : null,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ошибка сохранения')
      }

      setMessage({ type: 'success', text: 'Пост успешно сохранён' })
      
      if (!isEditing) {
        setPosts(prev => [...prev, { ...currentPost, id: result.data?.id }])
      } else {
        setPosts(prev => prev.map(p => p.id === currentPost.id ? currentPost : p))
        setIsEditing(false)
      }
      
      setCurrentPost(emptyPost)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка сохранения' })
    } finally {
      setIsSaving(false)
    }
  }, [currentPost, isEditing])

  const handleEditPost = useCallback((post: Post) => {
    setCurrentPost(post)
    setIsEditing(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleDeletePost = useCallback(async (postId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот пост?')) return

    try {
      const response = await fetch(`/api/blog-posts?id=${postId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Ошибка удаления')
      }

      setPosts(prev => prev.filter(p => p.id !== postId))
      setMessage({ type: 'success', text: 'Пост удалён' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Ошибка удаления' })
    }
  }, [])

  const handleCancel = useCallback(() => {
    setCurrentPost(emptyPost)
    setIsEditing(false)
    setMessage(null)
  }, [])

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light">Управление постами</h1>
          <p className="text-muted-foreground mt-1">
            Создание и редактирование записей блога
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-muted-foreground hidden md:block">
              {user.email}
            </div>
          )}
          <Button onClick={() => setCurrentPost(emptyPost)}>
            <Plus className="h-4 w-4 mr-2" />
            Новый пост
          </Button>
          <Button variant="outline" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Загрузка...
        </div>
      ) : !user ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Пожалуйста, войдите для управления постами
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Войти
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-600 border border-green-500/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Редактирование поста' : 'Новый пост'}</CardTitle>
          <CardDescription>
            Заполните информацию о посте
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Обложка поста</Label>
            <ImageUploader
              onImageUploaded={handleImageUploaded}
              existingImageUrl={currentPost.cover_image_url}
              existingFilePath={currentPost.cover_image_path}
              folder="covers"
              maxSizeMB={10}
            />
          </div>

          {/* Title & Slug */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title"
                value={currentPost.title}
                onChange={(e) => {
                  const title = e.target.value
                  setCurrentPost(prev => ({
                    ...prev,
                    title,
                    slug: prev.slug || generateSlug(title),
                  }))
                }}
                placeholder="Введите заголовок"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={currentPost.slug}
                  onChange={(e) => setCurrentPost(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="my-post"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setCurrentPost(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                  type="button"
                >
                  Авто
                </Button>
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Краткое описание (для превью)</Label>
            <Textarea
              id="excerpt"
              value={currentPost.excerpt}
              onChange={(e) => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Краткое описание поста..."
              rows={2}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Содержимое поста *</Label>
            <Textarea
              id="content"
              value={currentPost.content}
              onChange={(e) => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Текст поста (абзацы разделяются пустой строкой)"
              rows={10}
            />
            <p className="text-xs text-muted-foreground">
              Разделяйте абзацы пустой строкой для правильного форматирования
            </p>
          </div>

          {/* Credits */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Кредиты (метаданные)</Label>
              <Button variant="outline" size="sm" onClick={handleAddCredit} type="button">
                <Plus className="h-4 w-4 mr-1" />
                Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {currentPost.credits.map((credit, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    value={credit.label}
                    onChange={(e) => handleCreditChange(index, 'label', e.target.value)}
                    placeholder="Название (например: Локация)"
                    className="w-1/3"
                  />
                  <Input
                    value={credit.value}
                    onChange={(e) => handleCreditChange(index, 'value', e.target.value)}
                    placeholder="Значение"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCredit(index)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Published */}
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={currentPost.published}
              onCheckedChange={(checked) => setCurrentPost(prev => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published">Опубликовано</Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSavePost} disabled={isSaving || !currentPost.title || !currentPost.slug || !currentPost.content}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            {isEditing && (
              <Button variant="outline" onClick={handleCancel} type="button">
                Отмена
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Все посты</CardTitle>
            <CardDescription>
              {posts.length} пост{posts.length === 1 ? '' : posts.length < 5 ? 'а' : 'ов'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{post.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      /{post.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        post.published 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {post.published ? 'Опубликован' : 'Черновик'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {post.credits.find(c => c.label === 'Категория')?.value || 'Без категории'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePost(post.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </>
      )}
    </div>
  )
}
