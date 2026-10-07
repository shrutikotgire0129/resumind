import { useClerk, useAuth } from "@clerk/react-router";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => ([
    { title: "Resumind | Auth" },
    { name: "description", content: "Log into your account" },
]);

const Auth = () => {
    const { isLoaded, isSignedIn } = useAuth();
    const { openSignIn } = useClerk();
    const location = useLocation();
    const navigate = useNavigate();

    const next = new URLSearchParams(location.search).get("next") || "/";

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            navigate(next, { replace: true });
        }
    }, [isLoaded, isSignedIn, navigate, next]);

    const handleSignIn = () => {
        openSignIn({
            forceRedirectUrl: next,
        });
    };

    return (
        <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center">
            <div className="gradient-border shadow-lg">
                <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1>Welcome</h1>
                        <h2>Log In to Continue Your Job Journey</h2>
                    </div>

                    <div>
                        {!isLoaded ? (
                            <button
                                className="auth-button animate-pulse"
                                disabled
                            >
                                <p>Loading...</p>
                            </button>
                        ) : isSignedIn ? (
                            <button
                                className="auth-button"
                                onClick={() => navigate(next, { replace: true })}
                            >
                                <p>Continue</p>
                            </button>
                        ) : (
                            <button
                                className="auth-button"
                                onClick={handleSignIn}
                            >
                                <p>Log In</p>
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Auth;