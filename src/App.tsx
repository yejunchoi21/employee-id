import EmployeeCard from './components/EmployeeCard'
import { employee } from './data/employee'
import './App.css'

function App() {
  return (
    <main className="directory">
      <h1 className="directory__heading">Employee Directory</h1>
      <EmployeeCard employee={employee} />
    </main>
  )
}

export default App
