import { useParams } from 'react-router-dom'
import BoardView from '../components/board/BoardView.jsx'

export default function MainPage() {
  const { boardId } = useParams()

  if (!boardId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-gray-500">
        <div className="text-5xl">📋</div>
        <p className="text-lg font-medium">ברוך הבא ל-my-crm</p>
        <p className="text-sm">בחר בורד מהתפריט בצד, או צור מחלקה ובורד חדשים.</p>
      </div>
    )
  }

  return <BoardView key={boardId} boardId={boardId} />
}
