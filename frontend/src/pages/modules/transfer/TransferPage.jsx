import TransferRequestForm from "@/pages/modules/transfer/TransferRequestForm";

const MakeTransferPage = () => {
  return (
    <div className="space-y-6 max-w-full pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Make Transfer Request</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Submit your request for department or location change.</p>
      </div>
      <TransferRequestForm />
    </div>
  );
};

export default MakeTransferPage;