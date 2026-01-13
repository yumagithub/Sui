import Link from "next/link";
import Image from "next/image";

const Header = () => {
  return (
    <div className="sticky top-0 flex items-center gap-3 border-b">
      <header className="flex items-center h-18 px-4 bg-white/80 backdrop-blur-lg dark:bg-zinc-900/80 z-30">
        <h1>
          <Link href="/">
            <Image
              src="/icon/light.png"
              alt="Sui Logo"
              width={70}
              height={24}
              priority
              className="object-contain"
            />
          </Link>
        </h1>
        <p>Hello, admin</p>
      </header>
    </div>
  );
};

export default Header;
