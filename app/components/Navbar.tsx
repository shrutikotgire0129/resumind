import { UserButton } from "@clerk/react-router";
import { Link } from "react-router";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>

            <div className="flex items-center gap-4">
                <Link
                    to="/job-analyzer"
                    className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#6247AA] sm:block"
                >
                    Job Analyzer
                </Link>

                <Link
                    to="/applications"
                    className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#6247AA] sm:block"
                >
                    Applications
                </Link>

                <Link
                    to="/analytics"
                    className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-[#6247AA] sm:block"
                >
                    Analytics
                </Link>

                <Link to="/upload" className="primary-button w-fit">
                    Upload Resume
                </Link>

                <UserButton />
            </div>
        </nav>
    );
};
export default Navbar;