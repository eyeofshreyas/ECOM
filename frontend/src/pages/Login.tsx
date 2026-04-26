import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    const redirect = location.search ? location.search.split('=')[1] : '/';

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            navigate(redirect);
        }
    }, [navigate, redirect]);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            setIsLoading(true);
            const { data } = await api.post('/users/login', {
                email: values.email,
                password: values.password,
            });

            localStorage.setItem('userInfo', JSON.stringify(data));
            toast({
                title: "Logged in!",
                description: "Welcome back.",
            });
            navigate(redirect);
            window.location.reload();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: error.response?.data?.message || "Invalid email or password",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            toast({ variant: "destructive", title: "Google sign-in failed", description: "No credential received" });
            return;
        }
        try {
            setIsLoading(true);
            const { data } = await api.post('/users/auth/google', {
                credential: credentialResponse.credential,
            });
            localStorage.setItem('userInfo', JSON.stringify(data));
            toast({
                title: "Logged in!",
                description: "Welcome back.",
            });
            navigate(redirect);
            window.location.reload();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Google sign-in failed",
                description: error.response?.data?.message || "Google sign-in failed",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        toast({
            variant: "destructive",
            title: "Login failed",
            description: "Google sign-in failed",
        });
    };

    return (
        <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
                    <CardDescription>
                        Enter your email and password to sign in
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>
                    </Form>
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or</span>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            useOneTap={false}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to={redirect ? `/register?redirect=${redirect}` : "/register"} className="text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
