import { createServerFn, useServerFn } from '@tanstack/react-start'
import { PlusIcon, SaveIcon, TrashIcon } from 'lucide-react'
import { FormEvent, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { z } from 'zod'
import { db } from '@/db'
import { todos } from '@/db/schema'
import { redirect } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'

const addTodo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    await db.insert(todos).values({ ...data, isComplete: false })

    throw redirect({ to: "/" })
  })

const updateTodo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      isComplete: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    await db
      .update(todos)
      .set({ name: data.name, isComplete: data.isComplete })
      .where(eq(todos.id, data.id))

    throw redirect({ to: "/" })
  })

const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(todos).where(eq(todos.id, data.id))

    throw redirect({ to: "/" })
  })

export function TodoForm({ todo }: { todo?: typeof todos.$inferSelect }) {
  const nameRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(todo?.isComplete ?? false)
  const addTodoFn = useServerFn(addTodo)
  const updateTodoFn = useServerFn(updateTodo)
  const deleteTodoFn = useServerFn(deleteTodo)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const name = nameRef.current?.value
    if (!name) return

    if (todo) {
      await updateTodoFn({
        data: { id: todo.id, name, isComplete },
      })
    } else {
      await addTodoFn({ data: { name } })
    }
    
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!todo) return
    setIsLoading(true)
    await deleteTodoFn({ data: { id: todo.id } })
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      {todo && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isComplete"
              checked={isComplete}
              onChange={(e) => setIsComplete(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isComplete" className="text-sm font-medium">
              Mark as complete
            </label>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        autoFocus
        ref={nameRef}
        defaultValue={todo?.name}
        placeholder="Enter your todo..."
        className="flex-1"
        aria-label="Name"
      />
      <Button
        type="submit"
        disabled={isLoading}
        className="flex gap-2 items-center"
      >
        {todo ? <SaveIcon /> : <PlusIcon />} {todo ? "Save" : "Add"}
      </Button>
    </form>
    </div>
  )
}
