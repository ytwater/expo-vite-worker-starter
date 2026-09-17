import { Route, Routes } from "react-router-dom";

import { HomePage } from "~/routes/home";
import { PostPage } from "~/routes/post";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/post/:id" element={<PostPage />} />
    </Routes>
  );
}
