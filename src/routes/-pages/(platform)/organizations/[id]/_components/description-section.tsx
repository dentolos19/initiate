import { Card, CardContent } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import { Organization } from "#/lib/backend/schema";

export default function DescriptionSection(props: { data: Organization }) {
  return (
    <Card>
      <CardContent>
        <RichViewer content={props.data.description || "No description available."} />
      </CardContent>
    </Card>
  );
}
