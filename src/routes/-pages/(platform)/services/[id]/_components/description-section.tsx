import { Card, CardContent } from "#/components/ui/card";
import { RichViewer } from "#/components/ui/custom/rich";
import { Service } from "#/lib/backend/schema";

export default function DescriptionSection(props: { data: Service }) {
  return (
    <Card>
      <CardContent>
        <RichViewer content={props.data.description || "No description available."} />
      </CardContent>
    </Card>
  );
}
