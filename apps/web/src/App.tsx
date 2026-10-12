import Sidebar from './components/Sidebar'
import PromptBox from './components/PromptBox'

export default function App(){
 return (
  <div className="app">
   <Sidebar />
   <main className="workspace">
    <h1>DesignBuddy AI</h1>
    <p>AI Design Workspace</p>
    <PromptBox />
   </main>
  </div>
 )
}
