import { Form } from "@remix-run/react";

export const action = () => {};
export default function EditProfilePage() {
  return (
    <Form id="profile-edit" method="POST" className="flex items-center h-screen">
      <p className="block">
        <label className="text-white m-4">Name</label>
        <input name="name" type="text" />
      </p>
      <p>
        <label className="text-white m-4">Alias</label>
        <input name="name" type="text" />
      </p>
      
      
      <button type="submit"></button>
    </Form>
  );
}
