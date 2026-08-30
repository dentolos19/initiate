import LoadingSpinner from "#/components/loading-spinner";

export default function Loading() {
  return (
    <div className={"grid size-full place-content-center"}>
      <LoadingSpinner className={"my-20"} size={"lg"} />
    </div>
  );
}
