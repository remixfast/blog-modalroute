// -------------------------------------------------------------
// Generated using https://remixfast.com/
// Docs: https://remixfast.com/docs/routes
// App: ModalRoute
// -------------------------------------------------------------
import { ActionArgs, json, LoaderArgs, redirect } from '@remix-run/node';
import { useCatch, useLoaderData, useNavigate, useParams } from '@remix-run/react';
import invariant from 'tiny-invariant';
//
import { useMatchesData } from '~/hooks/useMatchesData';
//
import { Widget } from '@prisma/client';
import * as widgetDb from '~/models/widget.server';
import { getWidgetFromForm, getNewWidget, validateWidget } from '~/models/widget';
//
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
//

export async function loader({ params, request }: LoaderArgs) {
  // TODO: get/ensure app user and check rights
  const id = +(params.widgetId || 0);
  if (!id || id == 0) {
    return json({});
  }
  //
  const data = await widgetDb.getWidgetById(id);
  if (!data) {
    throw new Response('Widget not found', { status: 404 });
  }
  // no need to send data if reading from parent loaders
  // if you are doing additional data read, use next line to send data
  return json({});
  //return json({ widget });
}

export async function action({ request, params }: ActionArgs) {
  // TODO: get/ensure app user
  const url = new URL(request.url);
  const formData = await request.formData();

  // requires _method to exists to determine action to take
  // use button name="_method" value="put/del/post" inside form
  let method = formData.get?.('_method') || request.method;
  method = (method as string).toLowerCase();

  // widgetItem is used to return data back in case of error
  // not prepared object so as not to reveal any secrets, only return what was sent
  const widgetItem: Partial<Widget> = Object.fromEntries(formData);

  // validate
  const errors = validateWidget(formData, method);
  if (Object.keys(errors)?.length) {
    return json({ errors, item: widgetItem });
  }

  // primary key
  const id = +(params.widgetId || 0);
  let redirectTo = 'widget';
  //
  if (method === 'del') {
    // TODO: check rights
    //
    try {
      const result = await widgetDb.deleteWidget(id);
      if (!result) {
        throw new Error('delete widget failed');
      }
    } catch (error: any) {
      return json({
        errors: {
          other: `Failed to delete Widget with error ${error?.message || error}`,
        },
        widget: widgetItem,
      });
    }
    // all good
    return redirect(`/${redirectTo}${url.search}`);
  } else if (method === 'post') {
    // TODO: check rights
    //

    // build widget
    let widgetFromForm: Partial<Widget> = {
      ...getNewWidget(),
      ...getWidgetFromForm(formData),
    };
    // remove no insert fields
    const { widgetId, ...widgetToAdd } = widgetFromForm;

    // TODO: setup field default values

    //
    try {
      const result = await widgetDb.createWidget(widgetToAdd);
      if (!result || !result.widgetId) {
        throw new Error('create Widget failed');
      }
    } catch (error: any) {
      return json({
        errors: {
          other: `Failed to create Widget ${label} with error ${error?.message || error}`,
        },
        widget: widgetItem,
      });
    }
    //
    return redirect(`/${redirectTo}${url.search}`);
  } else if (method === 'put') {
    // check rights

    //

    // build widget
    const widgetFromForm: Partial<Widget> = getWidgetFromForm(formData, false);
    // remove no update fields
    const { widgetId, ...widgetToUpdate } = widgetFromForm;
    // TODO: setup field default values
    // setup primary key field
    (widgetToUpdate as Partial<Widget>).widgetId = id;

    //
    try {
      const result = await widgetDb.updateWidget(widgetToUpdate);
      if (!result) {
        throw new Error('update Widget failed');
      }
    } catch (error: any) {
      return json({
        errors: {
          other: `Failed to update Widget ${label} with error ${error?.message || error}`,
        },
        widget: widgetItem,
      });
    }
    //
    return redirect(`/${redirectTo}${url.search}`);
  }
}
export default function WidgetFormRoute() {
  //const {widget} = useLoaderData<typeof loader>();
  // OR
  const { widgetList } = useMatchesData('routes/widget') as { widgetList: Widget[] };
  const params = useParams();
  const widgetId = +(params.widgetId || 0);
  const widget: Widget = widgetList.find?.((r: Widget) => r.widgetId === widgetId) || getNewWidget();
  //
  let [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const handleClose = () => {
    setIsOpen(false);
    navigate(-1);
  };
  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0  flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-96 rounded bg-white">
          <div className="m-4 flex flex-col  rounded-md border p-4">
            <div className="text-large font-semibold">{widget.widgetName}</div>
            <div>{widget.widgetNumber}</div>
            <button className="mt-4 self-end" onClick={handleClose}>
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return <div className="p-12 text-red-500">{`No widget found with the ID of "${params.widgetId}"`}</div>;
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="absolute inset-0 flex justify-center bg-red-100 pt-4">
      <div className="text-red-brand text-center">
        <div className="text-[14px] font-bold">Oh snap!</div>
        <div className="px-2 text-[12px]">There was a problem. Sorry.</div>
      </div>
    </div>
  );
}
