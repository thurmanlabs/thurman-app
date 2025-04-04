import React from "react";
import BackgroundContainer from "../components/BackgroundContainer";
import ContentContainer from "../components/ContentContainer";
import useAccount from "../hooks/useAccount";

export default function Home() {
  const { user } = useAccount();

  return (
    <BackgroundContainer>
      <ContentContainer>
        <div>{user?.account}</div>
      </ContentContainer>
    </BackgroundContainer>
  );
}
