import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerWalletsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Partner Wallets</h1>
        <p className="text-muted-foreground">
          Manage partner wallet information and transactions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Partner Wallets Management</h3>
            <p className="text-muted-foreground max-w-md">
              This feature is currently under development. Partner wallet management 
              functionality will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}