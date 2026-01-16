import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { db } from '@/db'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { Todo } from '@/components/types'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { todos as todosSchema } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { useState, useEffect } from 'react'

const serverLoader = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await db.query.todos.findMany({
      orderBy: desc(todosSchema.createdAt),
    })
  } catch (e) {
    console.error('Failed to fetch todos:', e)
    throw e
  }
})

const toggleTodo = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string(),
      isComplete: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    await db
      .update(todosSchema)
      .set({ isComplete: data.isComplete })
      .where(eq(todosSchema.id, data.id))
  })

const deleteTodo = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(todosSchema).where(eq(todosSchema.id, data.id))
  })

export const Route = createFileRoute('/')({
  component: App,
  loader: () => {
    console.log('loading data')
    return serverLoader()
  },
})

function App() {
  const todos = Route.useLoaderData()
  const completedTodos = todos.filter((todo) => todo.isComplete).length
  const totalTodos = todos.length

  return (
    <div className="min-h-screen p-6 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h1 className="text-3xl font-bold tracking-tight">Todo List</h1>
          <Button size="sm" asChild>
            <Link to="/todos/new">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Todo
            </Link>
          </Button>
        </div>

        {totalTodos > 0 && (
          <div>
            <Badge variant="outline" className="text-sm font-normal py-1 px-3">
              {completedTodos} of {totalTodos} completed
            </Badge>
          </div>
        )}
        {<TodoListTable todos={todos} />}
      </div>
    </div>
  )
}

function TodoListTable({ todos }: { todos: Todo[] }) {
  if (todos.length === 0) {
    return (
      <>
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No todos found</EmptyTitle>
            <EmptyDescription>Add a todo to get started</EmptyDescription>
            <Button size="sm" asChild>
              <Link to="/todos/new">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Todo
              </Link>
            </Button>
          </EmptyHeader>
        </Empty>
      </>
    )
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead className="w-[50%]">Task</TableHead>
            <TableHead>Created on</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todos.map((todo) => (
            <TodoTableRow key={todo.id} todo={todo} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function TodoTableRow({ todo }: { todo: Todo }) {
  const router = useRouter()
  const toggleTodoFn = useServerFn(toggleTodo)
  const deleteTodoFn = useServerFn(deleteTodo)
  const [isComplete, setIsComplete] = useState(todo.isComplete)
  const [isDeleted, setIsDeleted] = useState(false)

  useEffect(() => {
    setIsComplete(todo.isComplete)
  }, [todo.isComplete])

  const handleToggle = () => {
    const newIsComplete = !isComplete
    setIsComplete(newIsComplete)
    toggleTodoFn({ data: { id: todo.id, isComplete: newIsComplete } })
      .catch(() => setIsComplete(!newIsComplete))
      .then(() => router.invalidate())
  }

  const handleDelete = () => {
    setIsDeleted(true)
    deleteTodoFn({ data: { id: todo.id } })
      .catch(() => setIsDeleted(false))
      .then(() => router.invalidate())
  }

  if (isDeleted) return null

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={isComplete} onCheckedChange={handleToggle} />
      </TableCell>
      <TableCell
        className={`font-medium ${isComplete ? "line-through text-muted" : ""}`}
      >
        {todo.name}
      </TableCell>
      <TableCell>{new Date(todo.createdAt).toLocaleDateString("en-GB")}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/todos/$id/edit" params={{ id: todo.id }}>
              <PencilIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
