import WelcomeMessage from '../components/WelcomeMessage';
import Sidebar from "../components/Sidebar";

function HomePage() {
    return (
      <div>
        <Sidebar />
        <h1>Добро пожаловать в CRM</h1>
        <WelcomeMessage />
      </div>
    );
  }
  
  export default HomePage;
  