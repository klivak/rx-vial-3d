import { Details } from "@/components/Details";
import { SceneLayer } from "@/components/SceneLayer";
import { Sections } from "@/components/Sections";

export default function Home() {
  return (
    <>
      <SceneLayer />
      <p className="sr-only">
        An amber glass medicine vial with an Aurel Daily label and a sage cap on a soft studio background. As you scroll, the camera moves around the vial and its delivery box opens.
      </p>
      <Sections />
      <Details />
    </>
  );
}
