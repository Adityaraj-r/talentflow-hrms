import TransferRequestForm from "@/pages/modules/transfer/TransferRequestForm";

const MakeTransferPage = () => {
  return (
    <div className="p-1 md:p-0 space-y-2">
      <div>
        <h1 className="text-3xl  font-bold dark:text-white">Make Transfer Request</h1>
        <p className="text-m  pt-1 text-muted-foreground">Submit your request for department or location change.</p>
      </div>
      <TransferRequestForm />
    </div>
  );
};

export default MakeTransferPage;