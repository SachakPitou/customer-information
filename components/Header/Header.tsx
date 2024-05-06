import User from '../User';
import classes from './Header.module.css';

export default async function Header() {
  return (
    <div className={classes.header}>
      <img src="img/matinternet.png" alt="MAT Logo" className="h-24 w-auto" />
      <User />
    </div>
  );
}
