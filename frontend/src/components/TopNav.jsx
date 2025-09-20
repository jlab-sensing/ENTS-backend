import { React } from 'react';
import Nav from './Nav';
import useAuth from '../auth/hooks/useAuth';

function TopNav() {
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();
  return <Nav user={user} setUser={setUser} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
}

export default TopNav;


