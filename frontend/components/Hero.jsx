export default function Hero() {
    return (
        <section id="Home" className="pt-20 flex justify-around flex-1 max-sm:flex-col px-4">
            <div className="container px-6 mx-auto">
                <div className="items-center lg:flex gap-4">
                    <div className="w-full lg:w-1/2">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-800 lg:text-5xl">Never miss an </h1>
                            <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-800 lg:text-5xl">
                                <span className="text-malachite-500">Important</span> email again.
                            </h1>
                            <p className="mt-3 text-gray-600 dark:text-gray-4600">
                                Get real-time email notifications, smart filtering, and attachment previews directly in WhatsApp. Stay focused and organized.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center w-full mt-6 lg:mt-0 lg:w-1/2">
                        <img className="w-full h-full max-w-md rounded-xl" src="/images/Mail-sent.gif" alt="Mail Sent Illustration" />
                    </div>
                </div>
            </div>
        </section>
    );
}
