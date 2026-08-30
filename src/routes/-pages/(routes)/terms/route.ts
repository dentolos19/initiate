import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(
    "https://docs.google.com/document/d/1J7slDBSx0vYs_axneAgskUaDcfYK0ZgM3DMXBcqptyA/edit?usp=sharing",
  );
}
