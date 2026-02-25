import TransferRequestForm from "@/pages/modules/transfer/TransferRequestForm";

const MakeTransferPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Make Transfer Request</h1>
        <p className="text-muted-foreground">Submit your request for department or location change.</p>
      </div>
      <TransferRequestForm />
    </div>
  );
};

export default MakeTransferPage;