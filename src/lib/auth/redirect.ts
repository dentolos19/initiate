export const getAuthDestination = (redirect: string | null) => {
  if (!redirect?.startsWith("/") || redirect.startsWith("//")) return "/";
  return redirect;
};
