import { Backdrop, Footer, Header } from '../components/Chrome';
import { Wizard } from '../components/Wizard';

export function ApplyPage() {
  return (
    <>
      <Backdrop />
      <div className="shell shell-apply">
        <Header />
        <Wizard />
        <Footer />
      </div>
    </>
  );
}
