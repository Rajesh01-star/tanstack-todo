import { createServerFn, useServerFn } from '@tanstack/react-start'
import { PlusIcon, SaveIcon } from 'lucide-react'
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
    })
  )
  .handler(async ({ data }) => {
    await db
      .update(todos)
      .set({ name: data.name })
      .where(eq(todos.id, data.id))

    throw redirect({ to: "/" })
  })

export function TodoForm({ todo }: { todo?: typeof todos.$inferSelect }) {
  const nameRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const addTodoFn = useServerFn(addTodo)
  const updateTodoFn = useServerFn(updateTodo)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const name = nameRef.current?.value
    if (!name) return

    if (todo) {
      await updateTodoFn({
        data: { id: todo.id, name },
      })
    } else {
      await addTodoFn({ data: { name } })
    }
    
    setIsLoading(false)
  }

  return (
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
  )
}
