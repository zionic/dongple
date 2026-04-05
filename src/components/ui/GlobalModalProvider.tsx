"use client";

import BottomSheet from "./BottomSheet";

export default function GlobalModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomSheet />
    </>
  );
}
