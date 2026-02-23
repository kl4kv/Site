import { PostManager } from '@/app/components/post-manager'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <PostManager />
      </div>
    </div>
  )
}
