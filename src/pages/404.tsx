import React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Atoms/Layout";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <Layout>
      <Head>
        <title>404 — Bruno Caruso</title>
        <meta name="description" content="Page not found." />
      </Head>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          404
        </h1>
        <p className="text-muted-foreground text-lg">
          The page you're looking for doesn't exist.
        </p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </Layout>
  );
};

export default NotFound;
