import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError, parseJsonBody } from "@/lib/api";
import { categoryCreateSchema } from "@/lib/validators/category";
import { createCategory, listCategories } from "@/server/category-service";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const typeParam = new URL(request.url).searchParams.get("type");
    const type =
      typeParam === "income" || typeParam === "expense" ? typeParam : undefined;
    const categories = await listCategories(user.id, type);
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = await parseJsonBody(request, categoryCreateSchema);
    const category = await createCategory(user.id, input);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
