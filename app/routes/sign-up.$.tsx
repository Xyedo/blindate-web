

import { SignUp } from "@clerk/remix";



export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignUp />
    </div>
  );
}